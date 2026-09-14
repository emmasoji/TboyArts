from pydantic import BaseModel, Field


class NewsletterSendRequest(BaseModel):
    subject: str = Field(..., min_length=1, max_length=200)
    html: str = Field(..., min_length=1)
    from_email: str | None = Field(default=None, max_length=320)
    from_name: str | None = Field(default=None, max_length=100)


class NewsletterSubscribeRequest(BaseModel):
    email: str = Field(..., min_length=4, max_length=320)
