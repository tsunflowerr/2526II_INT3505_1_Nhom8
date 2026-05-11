from argon2 import PasswordHasher
from flask import Blueprint, current_app, g, request
from sqlalchemy import inspect, text

from app.decorators import require_auth
from app.errors import AppError
from app.extensions import db
from app.models import Provider, Role, Status, User
from app.repositories import DELETED_USER_ID, UserRepository
from app.schemas import AdminCreateUserSchema, AdminUpdateUserSchema, UpdateMeSchema, user_to_dict
from app.services.storage_service import StorageService

bp = Blueprint("users", __name__, url_prefix="/users")
hasher = PasswordHasher()


def ensure_deleted_user_placeholder():
    placeholder = db.session.get(User, DELETED_USER_ID)
    if placeholder is not None:
        return placeholder

    placeholder = User(
        id=DELETED_USER_ID,
        email=None,
        password_hash=None,
        full_name="Deleted User",
        provider=Provider.LOCAL,
        role=Role.USER,
        status=Status.BLOCKED,
    )
    db.session.add(placeholder)
    db.session.flush()
    return placeholder


def table_has_column(table_name: str, column_name: str) -> bool:
    inspector = inspect(db.session.connection())
    if not inspector.has_table(table_name):
        return False
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def reassign_external_user_references(user_id):
    ensure_deleted_user_placeholder()
    params = {"deleted_user_id": str(DELETED_USER_ID), "user_id": str(user_id)}
    deleted_value = "CAST(:deleted_user_id AS uuid)" if db.engine.dialect.name == "postgresql" else ":deleted_user_id"
    user_value = "CAST(:user_id AS uuid)" if db.engine.dialect.name == "postgresql" else ":user_id"
    if table_has_column("bookings", "user_id"):
        db.session.execute(text(f"UPDATE bookings SET user_id = {deleted_value} WHERE user_id = {user_value}"), params)
    if table_has_column("events", "creator_id"):
        db.session.execute(text(f"UPDATE events SET creator_id = {deleted_value} WHERE creator_id = {user_value}"), params)


@bp.get("/me")
@require_auth()
def me():
    """Get current user profile.

        ---
        get:
            tags:
                - Users
            summary: Get current user profile
            security:
                - BearerAuth: []
            responses:
                '200':
                    description: OK
                    content:
                        application/json:
                            schema:
                                $ref: '#/components/schemas/UserSchema'
                '401':
                    $ref: '#/components/responses/ErrorResponse'
                '403':
                    $ref: '#/components/responses/ErrorResponse'
        """
    return user_to_dict(g.current_user)


@bp.patch("/me")
@require_auth()
def update_me():
    """Update current user profile.

        ---
        patch:
            tags:
                - Users
            summary: Update current user profile
            security:
                - BearerAuth: []
            requestBody:
                required: true
                content:
                    application/json:
                        schema:
                            $ref: '#/components/schemas/UpdateMeSchema'
            responses:
                '200':
                    description: OK
                    content:
                        application/json:
                            schema:
                                $ref: '#/components/schemas/UserSchema'
                '400':
                    $ref: '#/components/responses/ErrorResponse'
                '401':
                    $ref: '#/components/responses/ErrorResponse'
                '403':
                    $ref: '#/components/responses/ErrorResponse'
        """
    data = UpdateMeSchema().load(request.get_json(silent=True) or {})
    user = g.current_user
    for key, value in data.items():
        setattr(user, key, value)
    db.session.commit()
    return user_to_dict(user)


@bp.post("/me/media")
@require_auth()
def upload_me_media():
    """Upload media for current user.

        ---
        post:
            tags:
                - Users
            summary: Upload avatar or video to object storage
            security:
                - BearerAuth: []
            requestBody:
                required: true
                content:
                    multipart/form-data:
                        schema:
                            type: object
                            required:
                                - file
                            properties:
                                kind:
                                    type: string
                                    enum: [avatar, video]
                                file:
                                    type: string
                                    format: binary
            responses:
                '200':
                    description: OK
                    content:
                        application/json:
                            schema:
                                type: object
                                required:
                                    - url
                                properties:
                                    url:
                                        type: string
                '400':
                    $ref: '#/components/responses/ErrorResponse'
                '401':
                    $ref: '#/components/responses/ErrorResponse'
                '403':
                    $ref: '#/components/responses/ErrorResponse'
                '413':
                    $ref: '#/components/responses/ErrorResponse'
                '503':
                    $ref: '#/components/responses/ErrorResponse'
        """
    media_kind = request.form.get("kind", "avatar")
    upload_file = request.files.get("file")
    if upload_file is None:
        raise AppError("MISSING_FILE", "Upload file is required.", 400)

    storage = StorageService(current_app.config["APP_CONFIG"])
    file_url = storage.upload_user_media(str(g.current_user.id), upload_file, media_kind=media_kind)
    return {"url": file_url}


@bp.get("/<uuid:user_id>")
@require_auth(admin=True)
def get_user(user_id):
    """Get user by id (admin only).

        ---
        get:
            tags:
                - Users
            summary: Get user by id (admin only)
            security:
                - BearerAuth: []
            parameters:
                - in: path
                  name: user_id
                  required: true
                  schema:
                    type: string
                    format: uuid
            responses:
                '200':
                    description: OK
                    content:
                        application/json:
                            schema:
                                $ref: '#/components/schemas/UserSchema'
                '401':
                    $ref: '#/components/responses/ErrorResponse'
                '403':
                    $ref: '#/components/responses/ErrorResponse'
                '404':
                    $ref: '#/components/responses/ErrorResponse'
        """
    user = UserRepository().get_by_id(user_id)
    if user is None:
        raise AppError("USER_NOT_FOUND", "User was not found.", 404)
    return user_to_dict(user)


@bp.get("")
@require_auth(admin=True)
def list_users():
    users = UserRepository().list_all()
    return [user_to_dict(user) for user in users]


@bp.post("")
@require_auth(admin=True)
def create_user():
    payload = AdminCreateUserSchema().load(request.get_json(silent=True) or {})
    repo = UserRepository()
    if repo.get_by_email(payload["email"]):
        raise AppError("EMAIL_ALREADY_EXISTS", "Email is already registered.", 409)

    user = User(
        email=payload["email"].lower(),
        password_hash=hasher.hash(payload["password"]),
        full_name=payload["full_name"],
        provider=Provider.LOCAL,
        role=Role(payload["role"]),
        status=Status(payload["status"]),
    )
    repo.add(user)
    db.session.commit()
    return user_to_dict(user), 201


@bp.patch("/<uuid:user_id>")
@require_auth(admin=True)
def update_user(user_id):
    repo = UserRepository()
    user = repo.get_by_id(user_id)
    if user is None:
        raise AppError("USER_NOT_FOUND", "User was not found.", 404)

    payload = AdminUpdateUserSchema().load(request.get_json(silent=True) or {})
    if not payload:
        raise AppError("VALIDATION_ERROR", "At least one field is required.", 400)

    if "full_name" in payload:
        user.full_name = payload["full_name"]
    if "role" in payload:
        user.role = Role(payload["role"])
    if "status" in payload:
        user.status = Status(payload["status"])

    db.session.commit()
    return user_to_dict(user)


@bp.delete("/<uuid:user_id>")
@require_auth(admin=True)
def delete_user(user_id):
    repo = UserRepository()
    user = repo.get_by_id(user_id)
    if user is None:
        raise AppError("USER_NOT_FOUND", "User was not found.", 404)
    if user.id == g.current_user.id:
        raise AppError("FORBIDDEN", "You cannot delete your own account.", 403)
    if user.id == DELETED_USER_ID:
        raise AppError("FORBIDDEN", "The deleted-user placeholder cannot be deleted.", 403)

    reassign_external_user_references(user.id)
    repo.delete(user)
    db.session.commit()
    return "", 204
