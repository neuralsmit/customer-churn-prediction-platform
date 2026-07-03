from typing import Generator, Optional
from fastapi import Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from pydantic import ValidationError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.db import get_db
from app.core.security import verify_password
from app.models.models import User
from app.schemas.schemas import TokenData

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login-oauth2",
    auto_error=False
)

def get_current_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme),
    query_token: Optional[str] = Query(None, alias="token")
) -> User:
    actual_token = token or query_token
    if not actual_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    try:
        payload = jwt.decode(
            actual_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
            )
        token_data = TokenData(username=username)
    except (jwt.JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    user = db.query(User).filter(User.username == token_data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user
