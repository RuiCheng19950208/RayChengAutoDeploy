from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List

from .. import schemas
from ..database import get_db
from ..models import User
from ..dependencies import get_current_user


router = APIRouter()


@router.get("/leaderboard", response_model=List[schemas.LeaderboardEntry])
def get_leaderboard(db: Session = Depends(get_db)):
	"""获取排行榜，按照record降序排列，支持并列排名"""
	
	# 查询所有用户，按record降序排列
	users = db.query(User).order_by(desc(User.record), User.username).all()
	
	leaderboard = []
	current_rank = 1
	previous_record = None
	rank_counter = 0
	
	for user in users:
		rank_counter += 1
		
		# 如果当前用户的record与前一个用户不同，更新排名
		if previous_record is not None and user.record != previous_record:
			current_rank = rank_counter
		
		leaderboard.append(schemas.LeaderboardEntry(
			username=user.username,
			record=user.record,
			rank=current_rank
		))
		
		previous_record = user.record
	
	return leaderboard


@router.put("/update-record/{user_id}")
def update_user_record(user_id: int, new_record: float, db: Session = Depends(get_db)):
	"""更新用户记录（可以用于测试或管理）"""
	user = db.query(User).filter(User.id == user_id).first()
	if not user:
		raise HTTPException(status_code=404, detail="User not found")
	
	user.record = round(new_record, 2)  # 保留两位小数
	db.commit()
	db.refresh(user)
	
	return {"message": "Record updated successfully", "user": user.username, "new_record": user.record}


@router.post("/submit-score")
def submit_score(
	score_data: schemas.ScoreUpdate, 
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db)
):
	"""提交游戏分数，只有当新分数更高时才更新记录"""
	
	# 保留两位小数
	new_score = round(score_data.score, 2)
	
	# 只有新分数比当前记录高时才更新
	if new_score > current_user.record:
		current_user.record = new_score
		db.commit()
		db.refresh(current_user)
		
		return {
			"message": "New high score! Record updated successfully",
			"username": current_user.username,
			"old_record": current_user.record,
			"new_record": new_score,
			"is_new_record": True
		}
	else:
		return {
			"message": "Score submitted but not a new record",
			"username": current_user.username,
			"current_record": current_user.record,
			"submitted_score": new_score,
			"is_new_record": False
		}
