/* MariaDB DDL for CTF Platform (core tables + indexes + constraints) */
/* Use utf8mb4 and appropriate engine (InnoDB) */

CREATE DATABASE IF NOT EXISTS ctf_platform CHARACTER SET = 'utf8mb4' COLLATE = 'utf8mb4_unicode_ci';
USE ctf_platform;

-- users
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  role ENUM('player','admin') NOT NULL DEFAULT 'player',
  team_id BIGINT NULL,
  xp BIGINT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_active DATETIME,
  INDEX (team_id),
  INDEX (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- teams
CREATE TABLE teams (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL UNIQUE,
  captain_id BIGINT NULL,
  members_count INT DEFAULT 0,
  score_points BIGINT DEFAULT 0,
  hint_currency BIGINT DEFAULT 0,
  free_hints_left INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (captain_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- waves
CREATE TABLE waves (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100),
  start_time DATETIME,
  end_time DATETIME,
  status ENUM('scheduled','running','ended') DEFAULT 'scheduled',
  INDEX (start_time),
  INDEX (end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- challenges
CREATE TABLE challenges (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50),
  difficulty ENUM('easy','medium','hard','expert') DEFAULT 'medium',
  base_points INT NOT NULL DEFAULT 100,
  wave_id BIGINT NOT NULL,
  flag_hash VARCHAR(255),
  visible BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (wave_id),
  INDEX (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- hints
CREATE TABLE hints (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  challenge_id BIGINT NOT NULL,
  hint_number TINYINT NOT NULL, -- 1 or 2
  content TEXT NOT NULL,
  cost_type ENUM('free','currency','points') DEFAULT 'currency',
  cost_amount INT DEFAULT 0,
  INDEX (challenge_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- submissions
CREATE TABLE submissions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  team_id BIGINT NOT NULL,
  challenge_id BIGINT NOT NULL,
  attempt_text VARCHAR(1024),
  correct BOOLEAN DEFAULT FALSE,
  points_awarded INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip VARCHAR(50),
  INDEX (team_id, challenge_id),
  INDEX (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- score_history
CREATE TABLE score_history (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  team_id BIGINT,
  delta INT,
  reason VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (team_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- hint_requests
CREATE TABLE hint_requests (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  team_id BIGINT NOT NULL,
  challenge_id BIGINT NOT NULL,
  hint_id BIGINT NOT NULL,
  requested_by BIGINT NOT NULL,
  status ENUM('pending','approved','rejected','auto_approved') DEFAULT 'pending',
  approved_by BIGINT NULL,
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME NULL,
  auto_approved_at DATETIME NULL,
  note TEXT NULL,
  INDEX (team_id),
  INDEX (requested_by),
  INDEX (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- chat_messages
CREATE TABLE chat_messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  team_id BIGINT NULL,    -- NULL => global chat
  user_id BIGINT NOT NULL,
  content TEXT NOT NULL,
  message_type ENUM('text','system','flag','moderation') DEFAULT 'text',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted BOOLEAN DEFAULT FALSE,
  INDEX (team_id),
  INDEX (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- audit_logs (simple)
CREATE TABLE audit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  actor_user_id BIGINT NULL,
  action_type VARCHAR(100),
  payload JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (actor_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Foreign key constraints (add after tables created)
ALTER TABLE users ADD CONSTRAINT fk_users_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;
ALTER TABLE teams ADD CONSTRAINT fk_team_captain FOREIGN KEY (captain_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE challenges ADD CONSTRAINT fk_challenges_wave FOREIGN KEY (wave_id) REFERENCES waves(id) ON DELETE CASCADE;
ALTER TABLE hints ADD CONSTRAINT fk_hints_challenge FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE;
ALTER TABLE submissions ADD CONSTRAINT fk_submissions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE submissions ADD CONSTRAINT fk_submissions_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;
ALTER TABLE submissions ADD CONSTRAINT fk_submissions_challenge FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE;
ALTER TABLE hint_requests ADD CONSTRAINT fk_hintreq_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;
ALTER TABLE hint_requests ADD CONSTRAINT fk_hintreq_challenge FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE;
ALTER TABLE hint_requests ADD CONSTRAINT fk_hintreq_hint FOREIGN KEY (hint_id) REFERENCES hints(id) ON DELETE CASCADE;
ALTER TABLE hint_requests ADD CONSTRAINT fk_hintreq_user FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE;
