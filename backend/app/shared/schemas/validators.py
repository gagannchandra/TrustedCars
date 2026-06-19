import re
from pydantic import BaseModel, Field, field_validator


class ReasonRequest(BaseModel):
    reason: str = Field(min_length=10, max_length=1000)

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, v: str) -> str:
        # Trim whitespace
        v = v.strip()

        # Collapse repeated spaces
        v = re.sub(r"\s+", " ", v)

        # Reject simple repeated character strings (e.g. aaaaaaaaaa)
        if re.match(r"^(.)\1+$", v):
            raise ValueError("Reason lacks meaningful entropy.")

        # Reject specific low effort phrases
        low_effort = ["test test test", "asdfasdfasdf"]
        if any(v.lower().startswith(phrase) for phrase in low_effort):
            raise ValueError("Reason lacks meaningful entropy.")

        # Require alphabetic content
        if not re.search(r"[a-zA-Z]", v):
            raise ValueError("Reason must contain alphabetic characters.")

        if len(v) < 10:
            raise ValueError(
                "Reason must be at least 10 characters long after trimming."
            )

        return v
