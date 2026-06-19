import enum


class RoleEnum(str, enum.Enum):
    user = "user"
    dealer = "dealer"
    admin = "admin"
    support_agent = "support_agent"
    content_moderator = "content_moderator"
    superadmin = "superadmin"
