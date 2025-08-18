from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import schemas
from ..database import get_db
from ..models import User
from ..dependencies import get_current_user


router = APIRouter()


def require_admin(current_user: User = Depends(get_current_user)):
	"""验证当前用户是否为管理员"""
	if current_user.role != "admin":
		raise HTTPException(
			status_code=status.HTTP_403_FORBIDDEN,
			detail="Admin access required"
		)
	return current_user


@router.get("/users", response_model=List[schemas.UserOut])
def get_all_users(
	admin_user: User = Depends(require_admin),
	db: Session = Depends(get_db)
):
	"""获取所有用户列表（仅管理员）"""
	users = db.query(User).order_by(User.created_at.desc()).all()
	return users


@router.delete("/users/{user_id}")
def delete_user(
	user_id: int,
	admin_user: User = Depends(require_admin),
	db: Session = Depends(get_db)
):
	"""删除用户（仅管理员）"""
	
	# 不能删除自己
	if user_id == admin_user.id:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail="Cannot delete yourself"
		)
	
	# 查找要删除的用户
	user_to_delete = db.query(User).filter(User.id == user_id).first()
	if not user_to_delete:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="User not found"
		)
	
	# 删除用户
	username = user_to_delete.username
	db.delete(user_to_delete)
	db.commit()
	
	return {
		"message": f"User '{username}' deleted successfully",
		"deleted_user_id": user_id
	}


@router.get("/stats")
def get_admin_stats(
	admin_user: User = Depends(require_admin),
	db: Session = Depends(get_db)
):
	"""获取管理统计信息（仅管理员）"""
	
	total_users = db.query(User).count()
	admin_users = db.query(User).filter(User.role == "admin").count()
	regular_users = db.query(User).filter(User.role == "user").count()
	
	# 获取最高分用户
	top_scorer = db.query(User).order_by(User.record.desc()).first()
	
	return {
		"total_users": total_users,
		"admin_users": admin_users,
		"regular_users": regular_users,
		"top_scorer": {
			"username": top_scorer.username if top_scorer else None,
			"record": top_scorer.record if top_scorer else 0
		}
	}
