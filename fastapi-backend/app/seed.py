import random
import re
from sqlalchemy.exc import IntegrityError
from app.core.database import SessionLocal
from app.utils.auth import get_password_hash
from app.models import User, Team, Wave, Challenge, Submission


def simple_slugify(value: str) -> str:
	value = value.lower().strip()
	value = re.sub(r"[^a-z0-9]+", "-", value)
	value = re.sub(r"-+", "-", value)
	return value.strip("-")


def get_or_create(session, model, defaults=None, **kwargs):
	instance = session.query(model).filter_by(**kwargs).first()
	if instance:
		return instance
	params = {**kwargs}
	if defaults:
		params.update(defaults)
	instance = model(**params)
	session.add(instance)
	try:
		session.commit()
	except IntegrityError:
		session.rollback()
		instance = session.query(model).filter_by(**kwargs).first()
		if instance is None:
			raise
	return instance


def seed_waves(session):
	wave_names = ["red", "blue", "purple"]
	waves = {}
	for name in wave_names:
		waves[name] = get_or_create(session, Wave, name=name)
	return waves


def seed_teams_and_users(session):
	team_names = [
		"The Professor's Crew", "Tokyo's Raiders", "Berlin's Elite", "Nairobi's Squad",
		"Helsinki's Hackers", "Denver's Defenders", "Moscow's Masters",
		"Oslo's Operators", "Rio's Rebels", "Stockholm's Syndicate"
	]

	teams = []
	for name in team_names:
		team = get_or_create(session, Team, name=name)
		teams.append(team)

		user_count = random.randint(3, 5)
		base_username = simple_slugify(name)
		for i in range(user_count):
			username = f"{base_username}-{i+1}"
			email = f"{username}@example.com"
			get_or_create(
				session,
				User,
				defaults={
					"email": email,
					"password_hash": get_password_hash("password"),
					# role default is player; avoid enum mismatch by not setting explicitly
					"team_id": team.id,
				},
				username=username,
			)

		# update members_count based on actual db count
		members = session.query(User).filter(User.team_id == team.id).count()
		if hasattr(team, "members_count"):
			team.members_count = members
		session.add(team)
	
	session.commit()
	return teams


def seed_challenges(session, wave_by_name):
	challenges_data = [
		{"title": "Web Basics", "category": "web", "difficulty": "easy", "points": 100, "wave": "red"},
		{"title": "Simple Crypto", "category": "crypto", "difficulty": "easy", "points": 100, "wave": "red"},
		{"title": "File Recovery", "category": "forensics", "difficulty": "easy", "points": 150, "wave": "red"},
		{"title": "Reverse Me", "category": "reverse", "difficulty": "medium", "points": 250, "wave": "blue"},
		{"title": "Buffer Overflow", "category": "pwn", "difficulty": "medium", "points": 300, "wave": "blue"},
		{"title": "Secure Site", "category": "web", "difficulty": "medium", "points": 200, "wave": "blue"},
		{"title": "Advanced Crypto", "category": "crypto", "difficulty": "hard", "points": 500, "wave": "purple"},
		{"title": "Memory Forensics", "category": "forensics", "difficulty": "hard", "points": 450, "wave": "purple"},
		{"title": "Obfuscated Reverse", "category": "reverse", "difficulty": "hard", "points": 400, "wave": "purple"},
		{"title": "Kernel Exploit", "category": "pwn", "difficulty": "hard", "points": 500, "wave": "purple"},
		{"title": "SQL Injection", "category": "web", "difficulty": "medium", "points": 300, "wave": "blue"},
		{"title": "RSA Challenge", "category": "crypto", "difficulty": "medium", "points": 350, "wave": "blue"},
		{"title": "Network Analysis", "category": "forensics", "difficulty": "medium", "points": 250, "wave": "blue"},
		{"title": "Easy Reverse", "category": "reverse", "difficulty": "easy", "points": 200, "wave": "red"},
		{"title": "Stack Overflow", "category": "pwn", "difficulty": "easy", "points": 200, "wave": "red"},
	]

	for data in challenges_data:
		wave = wave_by_name[data["wave"]]
		points_field = "points" if hasattr(Challenge, "points") else "base_points"
		flag_value = f"flag{{{data['title']}}}"
		defaults = {
			"category": data["category"],
			"difficulty": data["difficulty"],
			points_field: data["points"],
			"wave_id": wave.id,
		}
		if hasattr(Challenge, "flag"):
			defaults["flag"] = flag_value
		else:
			defaults["flag_hash"] = get_password_hash(flag_value)

		get_or_create(
			session,
			Challenge,
			defaults=defaults,
			title=data["title"],
		)


def seed_points(session):
	teams = session.query(Team).all()
	for team in teams:
		points = random.randint(2000, 3000)
		if hasattr(team, "total_points"):
			team.total_points = points
		else:
			# fallback field name used in current models
			team.score_points = points
		session.add(team)
	session.commit()


def seed_all():
	session = SessionLocal()
	try:
		waves = seed_waves(session)
		seed_teams_and_users(session)
		seed_challenges(session, waves)
		seed_points(session)

		user_count = session.query(User).count()
		team_count = session.query(Team).count()
		wave_count = session.query(Wave).count()
		challenge_count = session.query(Challenge).count()
		print(f"Seed complete: {user_count} users, {team_count} teams, {wave_count} waves, {challenge_count} challenges")
	finally:
		session.close()


if __name__ == "__main__":
	seed_all()