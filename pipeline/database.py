"""
ParaSync — SQLite database layer (SQLAlchemy ORM).

Tables
------
athletes   – athlete profiles (id, name, sport, ipc_class, …)
sessions   – one row per analysis run; stores full JSON results
"""

import hashlib
import hmac
import json
import os
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from sqlalchemy import (
    create_engine, Column, String, Integer, Float,
    Text, DateTime, Boolean, ForeignKey, Index,
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship, Session

# ─── Engine ───────────────────────────────────────────────────────────────────
DATABASE_URL = "sqlite:///./parasync.db"   # file stored next to api.py

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},   # needed for SQLite + FastAPI
    echo=False,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Export SessionLocal so api.py can open its own sessions for fire-and-forget saves
__all__ = ["SessionLocal", "Base", "engine", "init_db", "get_db",
           "upsert_athlete", "save_session",
           "get_sessions_for_athlete", "get_session_by_id", "get_all_athletes",
           "User", "create_user", "get_user_by_email", "get_user_by_id", "verify_password",
           "AthleteCoach", "connect_athlete_coach", "get_coaches_for_athlete",
           "AthleteScout", "connect_athlete_scout", "get_scouts_for_athlete",
           "respond_to_coach_connection", "respond_to_scout_connection",
           "get_pending_coach_requests", "get_pending_scout_requests",
           "get_athletes_for_coach", "get_athletes_for_scout",
           "Message", "send_message", "get_thread_messages", "is_connection_accepted",
           "TrainingAssignment", "create_training_assignment", "get_training_for_coach",
           "get_training_for_athlete", "update_training_status", "delete_training_assignment",
           "Watchlist", "add_to_watchlist", "remove_from_watchlist", "get_watchlist_athlete_ids",
           "ScoutNote", "create_scout_note", "get_scout_notes", "delete_scout_note",
           "set_ipc_verified",
           "Notification", "notify_new_session", "get_notifications_for_user",
           "get_unread_notification_count", "mark_notification_read", "mark_all_notifications_read",
           "SessionRequest", "create_session_request", "get_session_requests_for_athlete",
           "get_session_requests_for_coach", "update_session_request_status", "fulfill_session_request"]

CONNECTION_STATUSES = ("pending", "accepted", "declined")


# ─── Models ───────────────────────────────────────────────────────────────────

class Athlete(Base):
    __tablename__ = "athletes"

    id          = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name        = Column(String, nullable=False, default="Unknown Athlete")
    sport       = Column(String, nullable=False)
    ipc_class   = Column(String, nullable=False)
    date_of_birth = Column(String, nullable=True)
    state       = Column(String, nullable=True)   # geo filtering for scout/coach discovery
    city        = Column(String, nullable=True)
    discoverable  = Column(Boolean, default=True)
    view_count  = Column(Integer, nullable=False, default=0)
    ipc_verified = Column(Boolean, nullable=False, default=False)   # set by a federation account, not self-reported
    created_at  = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    sessions = relationship("AnalysisSession", back_populates="athlete", cascade="all, delete-orphan")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id":           self.id,
            "name":         self.name,
            "sport":        self.sport,
            "ipc_class":    self.ipc_class,
            "date_of_birth":self.date_of_birth,
            "state":        self.state,
            "city":         self.city,
            "discoverable": self.discoverable,
            "ipc_verified": self.ipc_verified,
            "view_count":   self.view_count or 0,
            "created_at":   self.created_at.isoformat() if self.created_at else None,
        }


class User(Base):
    """
    Account for any role (athlete / coach / scout / federation).
    Prototype-grade auth: no email format or password-strength rules are
    enforced (per product decision) — passwords are still salted+hashed at rest.
    """
    __tablename__ = "users"

    id            = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name          = Column(String, nullable=False)
    email         = Column(String, nullable=False, unique=True, index=True)
    password_hash = Column(String, nullable=False)
    password_salt = Column(String, nullable=False)
    role          = Column(String, nullable=False)   # athlete | coach | scout | federation
    phone         = Column(String, nullable=True)
    sport         = Column(String, nullable=True)
    ipc_class     = Column(String, nullable=True)
    extra_json    = Column(Text, nullable=True)   # role-specific signup fields, stored as JSON
    created_at    = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> Dict[str, Any]:
        d: Dict[str, Any] = {
            "id":         self.id,
            "name":       self.name,
            "email":      self.email,
            "role":       self.role,
            "phone":      self.phone,
            "sport":      self.sport,
            "ipc_class":  self.ipc_class,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if self.extra_json:
            d.update(json.loads(self.extra_json))
        return d


class AthleteCoach(Base):
    """
    Many-to-many connection between an athlete and a coach.
    Athlete sends a request (status="pending"); coach accepts/declines.
    Column-level default "accepted" only protects pre-existing rows created
    before this status column existed — new rows always start "pending"
    (see connect_athlete_coach).
    """
    __tablename__ = "athlete_coaches"

    id         = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    athlete_id = Column(String, ForeignKey("athletes.id"), nullable=False, index=True)
    coach_id   = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    status     = Column(String, nullable=False, default="accepted")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (Index("ix_athlete_coach_unique", "athlete_id", "coach_id", unique=True),)


class AthleteScout(Base):
    """
    Many-to-many connection between an athlete and a scout.
    Athlete sends a request (status="pending"); scout accepts/declines.
    Column-level default "accepted" only protects pre-existing rows created
    before this status column existed — new rows always start "pending"
    (see connect_athlete_scout).
    """
    __tablename__ = "athlete_scouts"

    id         = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    athlete_id = Column(String, ForeignKey("athletes.id"), nullable=False, index=True)
    scout_id   = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    status     = Column(String, nullable=False, default="accepted")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (Index("ix_athlete_scout_unique", "athlete_id", "scout_id", unique=True),)


class Message(Base):
    """
    Chat message between an athlete and a scout/coach they're connected to.
    A "thread" is uniquely identified by (thread_type, athlete_id, counterpart_id).
    """
    __tablename__ = "messages"

    id             = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    thread_type    = Column(String, nullable=False)   # "scout" | "coach"
    athlete_id     = Column(String, ForeignKey("athletes.id"), nullable=False, index=True)
    counterpart_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    sender_id      = Column(String, ForeignKey("users.id"), nullable=False)
    body           = Column(Text, nullable=False)
    created_at     = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (Index("ix_message_thread", "thread_type", "athlete_id", "counterpart_id"),)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id":             self.id,
            "thread_type":    self.thread_type,
            "athlete_id":     self.athlete_id,
            "counterpart_id": self.counterpart_id,
            "sender_id":      self.sender_id,
            "body":           self.body,
            "created_at":     self.created_at.isoformat() if self.created_at else None,
        }


TRAINING_STATUSES = ("assigned", "in_progress", "completed")


class TrainingAssignment(Base):
    """A training task a coach assigns to one of their connected athletes —
    e.g. 'work on push symmetry' with an optional target pillar and due date.
    The athlete's status updates (marks in_progress/completed) happen in the
    mobile app; the web coach portal creates/views/edits them."""
    __tablename__ = "training_assignments"

    id            = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    coach_id      = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    athlete_id    = Column(String, ForeignKey("athletes.id"), nullable=False, index=True)
    title         = Column(String, nullable=False)
    description   = Column(Text, nullable=True)
    target_pillar = Column(String, nullable=True)   # e.g. "Motion & Kinematics" — matches metric_cards pillar names
    due_date      = Column(String, nullable=True)    # ISO date string YYYY-MM-DD
    status        = Column(String, nullable=False, default="assigned")
    created_at    = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id":            self.id,
            "coach_id":      self.coach_id,
            "athlete_id":    self.athlete_id,
            "title":         self.title,
            "description":   self.description,
            "target_pillar": self.target_pillar,
            "due_date":      self.due_date,
            "status":        self.status,
            "created_at":    self.created_at.isoformat() if self.created_at else None,
        }


SESSION_REQUEST_STATUSES = ("pending", "fulfilled", "declined")


class SessionRequest(Base):
    """A coach asking a connected athlete to record and upload a new video
    session, optionally with a note (e.g. 'film today's match, full court
    view'). Fulfilled automatically when the athlete's next /analyse call
    references this request's id (see notify_new_session's call site in
    api.py); the athlete can also decline it outright."""
    __tablename__ = "session_requests"

    id                   = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    coach_id             = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    athlete_id           = Column(String, ForeignKey("athletes.id"), nullable=False, index=True)
    message              = Column(Text, nullable=True)
    status               = Column(String, nullable=False, default="pending")
    fulfilled_session_id = Column(String, ForeignKey("sessions.id"), nullable=True)
    created_at           = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id":                   self.id,
            "coach_id":             self.coach_id,
            "athlete_id":           self.athlete_id,
            "message":              self.message,
            "status":               self.status,
            "fulfilled_session_id": self.fulfilled_session_id,
            "created_at":           self.created_at.isoformat() if self.created_at else None,
        }


class Watchlist(Base):
    """A scout's shortlist — lighter-weight than a connection request, no
    athlete-side approval needed. A scout can watchlist any discoverable
    athlete just to keep an eye on them."""
    __tablename__ = "watchlist"

    id         = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    scout_id   = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    athlete_id = Column(String, ForeignKey("athletes.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (Index("ix_watchlist_unique", "scout_id", "athlete_id", unique=True),)


class ScoutNote(Base):
    """A scout's private note on an athlete — never visible to the athlete
    or other scouts, just this scout's own evaluation record."""
    __tablename__ = "scout_notes"

    id         = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    scout_id   = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    athlete_id = Column(String, ForeignKey("athletes.id"), nullable=False, index=True)
    text       = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id":         self.id,
            "scout_id":   self.scout_id,
            "athlete_id": self.athlete_id,
            "text":       self.text,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Notification(Base):
    """
    In-app notification for a scout/coach user — no email/push infra exists,
    so delivery is purely in-app (a bell icon + dropdown, polled on load).
    Currently only fired for one event: a connected athlete uploads a new
    session (see notify_new_session, called from api.py right after
    save_session in the /analyse flow).
    """
    __tablename__ = "notifications"

    id         = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id    = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    type       = Column(String, nullable=False)   # "new_session" (room to grow)
    message    = Column(String, nullable=False)
    athlete_id = Column(String, ForeignKey("athletes.id"), nullable=True)
    session_id = Column(String, ForeignKey("sessions.id"), nullable=True)
    read       = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id":         self.id,
            "user_id":    self.user_id,
            "type":       self.type,
            "message":    self.message,
            "athlete_id": self.athlete_id,
            "session_id": self.session_id,
            "read":       self.read,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class AnalysisSession(Base):
    __tablename__ = "sessions"

    id             = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    athlete_id     = Column(String, ForeignKey("athletes.id"), nullable=False, index=True)
    sport          = Column(String, nullable=False)
    ipc_class      = Column(String, nullable=False)
    date           = Column(String, nullable=False)   # ISO date string YYYY-MM-DD
    created_at     = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Video metadata
    video_filename        = Column(String, nullable=True)   # original filename, as uploaded
    video_stored_filename = Column(String, nullable=True)   # filename under data/session_videos/, if kept
    video_duration_sec    = Column(Float, nullable=True)
    video_fps             = Column(Float, nullable=True)
    video_resolution      = Column(String, nullable=True)   # "1920x1080"
    video_camera_angle    = Column(String, nullable=True)
    video_pixel_per_meter = Column(Float, nullable=True)
    video_frames_analysed = Column(Integer, nullable=True)
    pose_confidence_avg   = Column(Float, nullable=True)
    framing_feedback_json = Column(Text, nullable=True)   # {"quality":…, "message":…, "tips":[…]} — see api.py _framing_feedback()

    # Full JSON blobs
    metric_cards_json = Column(Text, nullable=True)   # JSON list of metric card dicts
    feedback_json     = Column(Text, nullable=True)   # {"scout_feedback":…, "coach_feedback":…}
    ai_log_json       = Column(Text, nullable=True)   # list of {msg, type}

    # Quick scalar summary fields for fast filtering
    pillars_computed  = Column(Integer, nullable=True)
    total_metric_cards= Column(Integer, nullable=True)
    pipeline_version  = Column(String, nullable=True)
    processing_time_sec= Column(Float, nullable=True)

    athlete = relationship("Athlete", back_populates="sessions")

    # ── helpers ────────────────────────────────────────────────────────────────
    @property
    def metric_cards(self) -> List[Dict]:
        return json.loads(self.metric_cards_json) if self.metric_cards_json else []

    @property
    def feedback(self) -> Dict:
        return json.loads(self.feedback_json) if self.feedback_json else {}

    @property
    def ai_log(self) -> List[Dict]:
        return json.loads(self.ai_log_json) if self.ai_log_json else []

    @property
    def framing_feedback(self) -> Optional[Dict]:
        return json.loads(self.framing_feedback_json) if self.framing_feedback_json else None

    def to_dict(self, include_cards: bool = True) -> Dict[str, Any]:
        d: Dict[str, Any] = {
            "id":           self.id,
            "athlete_id":   self.athlete_id,
            "sport":        self.sport,
            "ipc_class":    self.ipc_class,
            "date":         self.date,
            "created_at":   self.created_at.isoformat() if self.created_at else None,
            "video_metadata": {
                "filename":          self.video_filename,
                "has_video":         bool(self.video_stored_filename),
                "duration_sec":      self.video_duration_sec,
                "fps":               self.video_fps,
                "resolution":        self.video_resolution,
                "camera_angle":      self.video_camera_angle,
                "pixel_per_meter":   self.video_pixel_per_meter,
                "frames_analysed":   self.video_frames_analysed,
                "pose_confidence_avg": self.pose_confidence_avg,
                "framing_feedback":  self.framing_feedback,
            },
            "feedback":      self.feedback,
            "ai_log":        self.ai_log,
            "processing_meta": {
                "pipeline_version":   self.pipeline_version,
                "processing_time_sec":self.processing_time_sec,
                "pillars_computed":   self.pillars_computed,
                "total_metric_cards": self.total_metric_cards,
            },
        }
        if include_cards:
            d["metric_cards"] = self.metric_cards
        return d


# ─── Create tables on import ──────────────────────────────────────────────────
def _migrate_schema():
    """
    Base.metadata.create_all() only creates missing tables — it never alters
    existing ones. athlete_coaches/athlete_scouts predate the `status` column,
    and `sessions` predates `video_stored_filename` — add them by hand for
    any database created before those changes.
    """
    with engine.connect() as conn:
        for table in ("athlete_coaches", "athlete_scouts"):
            cols = [row[1] for row in conn.exec_driver_sql(f"PRAGMA table_info({table})")]
            if "status" not in cols:
                conn.exec_driver_sql(
                    f"ALTER TABLE {table} ADD COLUMN status TEXT NOT NULL DEFAULT 'accepted'"
                )

        session_cols = [row[1] for row in conn.exec_driver_sql("PRAGMA table_info(sessions)")]
        if "video_stored_filename" not in session_cols:
            conn.exec_driver_sql("ALTER TABLE sessions ADD COLUMN video_stored_filename TEXT")
        if "framing_feedback_json" not in session_cols:
            conn.exec_driver_sql("ALTER TABLE sessions ADD COLUMN framing_feedback_json TEXT")

        athlete_cols = [row[1] for row in conn.exec_driver_sql("PRAGMA table_info(athletes)")]
        if "view_count" not in athlete_cols:
            conn.exec_driver_sql("ALTER TABLE athletes ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0")
        if "state" not in athlete_cols:
            conn.exec_driver_sql("ALTER TABLE athletes ADD COLUMN state TEXT")
        if "city" not in athlete_cols:
            conn.exec_driver_sql("ALTER TABLE athletes ADD COLUMN city TEXT")
        if "ipc_verified" not in athlete_cols:
            conn.exec_driver_sql("ALTER TABLE athletes ADD COLUMN ipc_verified BOOLEAN NOT NULL DEFAULT 0")

        conn.commit()


def init_db():
    Base.metadata.create_all(bind=engine)
    _migrate_schema()


# ─── Dependency (FastAPI) ─────────────────────────────────────────────────────
def get_db():
    """Yield a DB session; close on exit. Use as FastAPI Depends()."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─── CRUD helpers ─────────────────────────────────────────────────────────────

def upsert_athlete(db: Session, athlete_id: str, sport: str, ipc_class: str,
                   name: str = "Unknown Athlete", state: Optional[str] = None,
                   city: Optional[str] = None) -> Athlete:
    """Get or create an athlete row — update name/sport if already exists."""
    athlete = db.query(Athlete).filter(Athlete.id == athlete_id).first()
    if athlete is None:
        athlete = Athlete(id=athlete_id, name=name, sport=sport, ipc_class=ipc_class,
                          state=state, city=city)
        db.add(athlete)
    else:
        # Update name only if a real name is provided (not the default)
        if name and name != "Unknown Athlete":
            athlete.name = name
        athlete.sport     = sport
        athlete.ipc_class = ipc_class
        if state:
            athlete.state = state
        if city:
            athlete.city = city
    db.flush()   # write to transaction but don't commit yet
    return athlete


def record_athlete_view(db: Session, athlete_id: str) -> Optional[int]:
    """Bump an athlete's profile view counter; returns the new count, or None if no such athlete."""
    athlete = db.query(Athlete).filter(Athlete.id == athlete_id).first()
    if athlete is None:
        return None
    athlete.view_count = (athlete.view_count or 0) + 1
    db.commit()
    return athlete.view_count


def save_session(db: Session, result: Dict[str, Any], video_filename: str = "",
                  video_stored_filename: Optional[str] = None) -> AnalysisSession:
    """
    Persist a full pipeline result dict to the sessions table.
    Returns the saved AnalysisSession ORM object.
    """
    vm   = result.get("video_metadata", {})
    pmeta= result.get("processing_meta", {})

    session = AnalysisSession(
        id             = result.get("session_id", str(uuid.uuid4())),
        athlete_id     = result.get("athlete_id", "unknown"),
        sport          = result.get("sport", ""),
        ipc_class      = result.get("ipc_class", ""),
        date           = datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        video_filename = video_filename,
        video_stored_filename = video_stored_filename,

        video_duration_sec    = vm.get("duration_sec"),
        video_fps             = vm.get("fps"),
        video_resolution      = str(vm.get("resolution", "")),
        video_camera_angle    = vm.get("camera_angle"),
        video_pixel_per_meter = vm.get("pixel_per_meter"),
        video_frames_analysed = vm.get("frames_analysed"),
        pose_confidence_avg   = vm.get("pose_confidence_avg"),
        framing_feedback_json = json.dumps(vm["framing_feedback"]) if vm.get("framing_feedback") else None,

        metric_cards_json = json.dumps(result.get("metric_cards", [])),
        feedback_json     = json.dumps(result.get("feedback", {})),
        ai_log_json       = json.dumps(result.get("ai_log", [])),

        pillars_computed   = result.get("pillars_computed") or 0,
        total_metric_cards = pmeta.get("total_metric_cards"),
        pipeline_version   = pmeta.get("pipeline_version"),
        processing_time_sec= pmeta.get("processing_time_sec"),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_sessions_for_athlete(db: Session, athlete_id: str,
                              limit: int = 20) -> List[AnalysisSession]:
    """Return most-recent sessions for an athlete, newest first."""
    return (
        db.query(AnalysisSession)
          .filter(AnalysisSession.athlete_id == athlete_id)
          .order_by(AnalysisSession.created_at.desc())
          .limit(limit)
          .all()
    )


def get_session_by_id(db: Session, session_id: str) -> Optional[AnalysisSession]:
    return db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()


def get_all_athletes(db: Session, limit: int = 100, sport: Optional[str] = None,
                     ipc_class: Optional[str] = None, state: Optional[str] = None) -> List[Athlete]:
    q = db.query(Athlete)
    if sport:
        q = q.filter(Athlete.sport == sport)
    if ipc_class:
        q = q.filter(Athlete.ipc_class == ipc_class)
    if state:
        q = q.filter(Athlete.state == state)
    return q.order_by(Athlete.created_at.desc()).limit(limit).all()


# ─── Password hashing (stdlib PBKDF2, no extra dependency) ────────────────────

def _hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    salt = salt or os.urandom(16).hex()
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), 100_000)
    return digest.hex(), salt


def verify_password(password: str, password_hash: str, salt: str) -> bool:
    digest, _ = _hash_password(password, salt)
    return hmac.compare_digest(digest, password_hash)


# ─── User CRUD helpers ─────────────────────────────────────────────────────────

def create_user(db: Session, name: str, email: str, password: str, role: str,
                 phone: Optional[str] = None, sport: Optional[str] = None,
                 ipc_class: Optional[str] = None, extra: Optional[Dict[str, Any]] = None) -> User:
    password_hash, salt = _hash_password(password)
    user = User(
        name=name, email=email.strip().lower(),
        password_hash=password_hash, password_salt=salt,
        role=role, phone=phone, sport=sport, ipc_class=ipc_class,
        extra_json=json.dumps(extra) if extra else None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email.strip().lower()).first()


def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


# ─── Athlete-Coach connection helpers ──────────────────────────────────────────

def connect_athlete_coach(db: Session, athlete_id: str, coach_id: str) -> AthleteCoach:
    """
    Send a connection request (idempotent). A brand-new row starts "pending" —
    the coach must accept it (see respond_to_coach_connection) before chat
    unlocks. Re-calling this on an existing row just returns it unchanged.
    """
    existing = (
        db.query(AthleteCoach)
          .filter(AthleteCoach.athlete_id == athlete_id, AthleteCoach.coach_id == coach_id)
          .first()
    )
    if existing:
        return existing
    link = AthleteCoach(athlete_id=athlete_id, coach_id=coach_id, status="pending")
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


def respond_to_coach_connection(db: Session, athlete_id: str, coach_id: str, status: str) -> Optional[AthleteCoach]:
    """Coach accepts/declines a pending request. Returns None if no such connection exists."""
    if status not in CONNECTION_STATUSES:
        raise ValueError(f"invalid status: {status}")
    link = (
        db.query(AthleteCoach)
          .filter(AthleteCoach.athlete_id == athlete_id, AthleteCoach.coach_id == coach_id)
          .first()
    )
    if not link:
        return None
    link.status = status
    db.commit()
    db.refresh(link)
    return link


def get_coaches_for_athlete(db: Session, athlete_id: str) -> List[Dict[str, Any]]:
    """Every coach this athlete has a connection with (any status), newest first."""
    rows = (
        db.query(User, AthleteCoach.status)
          .join(AthleteCoach, AthleteCoach.coach_id == User.id)
          .filter(AthleteCoach.athlete_id == athlete_id)
          .order_by(AthleteCoach.created_at.desc())
          .all()
    )
    return [{"user": u, "status": status} for u, status in rows]


def get_pending_coach_requests(db: Session, coach_id: str) -> List[Dict[str, Any]]:
    """Pending incoming requests for a coach, athlete info joined, newest first."""
    rows = (
        db.query(Athlete, AthleteCoach.created_at)
          .join(AthleteCoach, AthleteCoach.athlete_id == Athlete.id)
          .filter(AthleteCoach.coach_id == coach_id, AthleteCoach.status == "pending")
          .order_by(AthleteCoach.created_at.desc())
          .all()
    )
    return [{"athlete": a, "requested_at": created_at} for a, created_at in rows]


def get_athletes_for_coach(db: Session, coach_id: str) -> List[Athlete]:
    """Accepted athlete connections for a coach — powers the coach's Messages list."""
    return (
        db.query(Athlete)
          .join(AthleteCoach, AthleteCoach.athlete_id == Athlete.id)
          .filter(AthleteCoach.coach_id == coach_id, AthleteCoach.status == "accepted")
          .order_by(AthleteCoach.created_at.desc())
          .all()
    )


# ─── Athlete-Scout connection helpers ──────────────────────────────────────────

def connect_athlete_scout(db: Session, athlete_id: str, scout_id: str) -> AthleteScout:
    """
    Send a connection request (idempotent). A brand-new row starts "pending" —
    the scout must accept it (see respond_to_scout_connection) before chat
    unlocks. Re-calling this on an existing row just returns it unchanged.
    """
    existing = (
        db.query(AthleteScout)
          .filter(AthleteScout.athlete_id == athlete_id, AthleteScout.scout_id == scout_id)
          .first()
    )
    if existing:
        return existing
    link = AthleteScout(athlete_id=athlete_id, scout_id=scout_id, status="pending")
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


def respond_to_scout_connection(db: Session, athlete_id: str, scout_id: str, status: str) -> Optional[AthleteScout]:
    """Scout accepts/declines a pending request. Returns None if no such connection exists."""
    if status not in CONNECTION_STATUSES:
        raise ValueError(f"invalid status: {status}")
    link = (
        db.query(AthleteScout)
          .filter(AthleteScout.athlete_id == athlete_id, AthleteScout.scout_id == scout_id)
          .first()
    )
    if not link:
        return None
    link.status = status
    db.commit()
    db.refresh(link)
    return link


def get_scouts_for_athlete(db: Session, athlete_id: str) -> List[Dict[str, Any]]:
    """Every scout this athlete has a connection with (any status), newest first."""
    rows = (
        db.query(User, AthleteScout.status)
          .join(AthleteScout, AthleteScout.scout_id == User.id)
          .filter(AthleteScout.athlete_id == athlete_id)
          .order_by(AthleteScout.created_at.desc())
          .all()
    )
    return [{"user": u, "status": status} for u, status in rows]


def get_pending_scout_requests(db: Session, scout_id: str) -> List[Dict[str, Any]]:
    """Pending incoming requests for a scout, athlete info joined, newest first."""
    rows = (
        db.query(Athlete, AthleteScout.created_at)
          .join(AthleteScout, AthleteScout.athlete_id == Athlete.id)
          .filter(AthleteScout.scout_id == scout_id, AthleteScout.status == "pending")
          .order_by(AthleteScout.created_at.desc())
          .all()
    )
    return [{"athlete": a, "requested_at": created_at} for a, created_at in rows]


def get_athletes_for_scout(db: Session, scout_id: str) -> List[Athlete]:
    """Accepted athlete connections for a scout — powers the scout's Messages list."""
    return (
        db.query(Athlete)
          .join(AthleteScout, AthleteScout.athlete_id == Athlete.id)
          .filter(AthleteScout.scout_id == scout_id, AthleteScout.status == "accepted")
          .order_by(AthleteScout.created_at.desc())
          .all()
    )


# ─── Messaging helpers ──────────────────────────────────────────────────────────

def is_connection_accepted(db: Session, thread_type: str, athlete_id: str, counterpart_id: str) -> bool:
    model = AthleteScout if thread_type == "scout" else AthleteCoach
    other_field = model.scout_id if thread_type == "scout" else model.coach_id
    link = (
        db.query(model)
          .filter(model.athlete_id == athlete_id, other_field == counterpart_id)
          .first()
    )
    return bool(link and link.status == "accepted")


def send_message(db: Session, thread_type: str, athlete_id: str, counterpart_id: str,
                  sender_id: str, body: str) -> Message:
    msg = Message(thread_type=thread_type, athlete_id=athlete_id,
                  counterpart_id=counterpart_id, sender_id=sender_id, body=body)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def get_thread_messages(db: Session, thread_type: str, athlete_id: str, counterpart_id: str) -> List[Message]:
    return (
        db.query(Message)
          .filter(Message.thread_type == thread_type, Message.athlete_id == athlete_id,
                   Message.counterpart_id == counterpart_id)
          .order_by(Message.created_at.asc())
          .all()
    )


# ─── Training assignments ──────────────────────────────────────────────────────

def create_training_assignment(db: Session, coach_id: str, athlete_id: str, title: str,
                                description: Optional[str] = None, target_pillar: Optional[str] = None,
                                due_date: Optional[str] = None) -> TrainingAssignment:
    assignment = TrainingAssignment(
        coach_id=coach_id, athlete_id=athlete_id, title=title,
        description=description, target_pillar=target_pillar, due_date=due_date,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


def get_training_for_coach(db: Session, coach_id: str) -> List[TrainingAssignment]:
    return (
        db.query(TrainingAssignment)
          .filter(TrainingAssignment.coach_id == coach_id)
          .order_by(TrainingAssignment.created_at.desc())
          .all()
    )


def get_training_for_athlete(db: Session, athlete_id: str) -> List[TrainingAssignment]:
    return (
        db.query(TrainingAssignment)
          .filter(TrainingAssignment.athlete_id == athlete_id)
          .order_by(TrainingAssignment.created_at.desc())
          .all()
    )


def update_training_status(db: Session, assignment_id: str, status: str) -> Optional[TrainingAssignment]:
    assignment = db.query(TrainingAssignment).filter(TrainingAssignment.id == assignment_id).first()
    if not assignment or status not in TRAINING_STATUSES:
        return None
    assignment.status = status
    db.commit()
    db.refresh(assignment)
    return assignment


def delete_training_assignment(db: Session, assignment_id: str) -> bool:
    assignment = db.query(TrainingAssignment).filter(TrainingAssignment.id == assignment_id).first()
    if not assignment:
        return False
    db.delete(assignment)
    db.commit()
    return True


# ─── Session requests (coach asks athlete to film a new session) ───────────────

def create_session_request(db: Session, coach_id: str, athlete_id: str, message: Optional[str] = None) -> SessionRequest:
    req = SessionRequest(coach_id=coach_id, athlete_id=athlete_id, message=message)
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


def get_session_requests_for_athlete(db: Session, athlete_id: str, status: Optional[str] = None) -> List[SessionRequest]:
    q = db.query(SessionRequest).filter(SessionRequest.athlete_id == athlete_id)
    if status:
        q = q.filter(SessionRequest.status == status)
    return q.order_by(SessionRequest.created_at.desc()).all()


def get_session_requests_for_coach(db: Session, coach_id: str) -> List[SessionRequest]:
    return (
        db.query(SessionRequest)
          .filter(SessionRequest.coach_id == coach_id)
          .order_by(SessionRequest.created_at.desc())
          .all()
    )


def update_session_request_status(db: Session, request_id: str, status: str) -> Optional[SessionRequest]:
    req = db.query(SessionRequest).filter(SessionRequest.id == request_id).first()
    if not req or status not in SESSION_REQUEST_STATUSES:
        return None
    req.status = status
    db.commit()
    db.refresh(req)
    return req


def fulfill_session_request(db: Session, request_id: str, session_id: str) -> Optional[SessionRequest]:
    """Called right after a new session is saved, if the /analyse call
    referenced a session_request_id — marks it fulfilled and links the
    resulting session, so the coach can see it was actually completed."""
    req = db.query(SessionRequest).filter(SessionRequest.id == request_id).first()
    if not req:
        return None
    req.status = "fulfilled"
    req.fulfilled_session_id = session_id
    db.commit()
    db.refresh(req)
    return req


# ─── Watchlist ──────────────────────────────────────────────────────────────────

def add_to_watchlist(db: Session, scout_id: str, athlete_id: str) -> Watchlist:
    existing = (
        db.query(Watchlist)
          .filter(Watchlist.scout_id == scout_id, Watchlist.athlete_id == athlete_id)
          .first()
    )
    if existing:
        return existing
    entry = Watchlist(scout_id=scout_id, athlete_id=athlete_id)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def remove_from_watchlist(db: Session, scout_id: str, athlete_id: str) -> bool:
    existing = (
        db.query(Watchlist)
          .filter(Watchlist.scout_id == scout_id, Watchlist.athlete_id == athlete_id)
          .first()
    )
    if not existing:
        return False
    db.delete(existing)
    db.commit()
    return True


def get_watchlist_athlete_ids(db: Session, scout_id: str) -> List[str]:
    rows = db.query(Watchlist).filter(Watchlist.scout_id == scout_id).all()
    return [r.athlete_id for r in rows]


# ─── Scout notes ────────────────────────────────────────────────────────────────

def create_scout_note(db: Session, scout_id: str, athlete_id: str, text: str) -> ScoutNote:
    note = ScoutNote(scout_id=scout_id, athlete_id=athlete_id, text=text)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


def get_scout_notes(db: Session, scout_id: str, athlete_id: str) -> List[ScoutNote]:
    return (
        db.query(ScoutNote)
          .filter(ScoutNote.scout_id == scout_id, ScoutNote.athlete_id == athlete_id)
          .order_by(ScoutNote.created_at.desc())
          .all()
    )


def delete_scout_note(db: Session, note_id: str, scout_id: str) -> bool:
    note = db.query(ScoutNote).filter(ScoutNote.id == note_id, ScoutNote.scout_id == scout_id).first()
    if not note:
        return False
    db.delete(note)
    db.commit()
    return True


def set_ipc_verified(db: Session, athlete_id: str, verified: bool) -> Optional[Athlete]:
    athlete = db.query(Athlete).filter(Athlete.id == athlete_id).first()
    if not athlete:
        return None
    athlete.ipc_verified = verified
    db.commit()
    db.refresh(athlete)
    return athlete


# ─── Notifications ──────────────────────────────────────────────────────────────

def notify_new_session(db: Session, athlete_id: str, session_id: str, athlete_name: str) -> List[Notification]:
    """Notify every scout/coach with an ACCEPTED connection to this athlete
    that a new session was analysed. Called once, right after save_session."""
    recipient_ids = set()
    for model, field in ((AthleteScout, AthleteScout.scout_id), (AthleteCoach, AthleteCoach.coach_id)):
        rows = (
            db.query(field)
              .filter(model.athlete_id == athlete_id, model.status == "accepted")
              .all()
        )
        recipient_ids.update(r[0] for r in rows)

    notifications = []
    for user_id in recipient_ids:
        n = Notification(
            user_id=user_id, type="new_session",
            message=f"{athlete_name} uploaded a new session",
            athlete_id=athlete_id, session_id=session_id,
        )
        db.add(n)
        notifications.append(n)
    if notifications:
        db.commit()
    return notifications


def get_notifications_for_user(db: Session, user_id: str, limit: int = 50) -> List[Notification]:
    return (
        db.query(Notification)
          .filter(Notification.user_id == user_id)
          .order_by(Notification.created_at.desc())
          .limit(limit)
          .all()
    )


def get_unread_notification_count(db: Session, user_id: str) -> int:
    return db.query(Notification).filter(Notification.user_id == user_id, Notification.read == False).count()  # noqa: E712


def mark_notification_read(db: Session, notification_id: str, user_id: str) -> Optional[Notification]:
    n = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == user_id).first()
    if not n:
        return None
    n.read = True
    db.commit()
    db.refresh(n)
    return n


def mark_all_notifications_read(db: Session, user_id: str) -> int:
    count = (
        db.query(Notification)
          .filter(Notification.user_id == user_id, Notification.read == False)  # noqa: E712
          .update({"read": True})
    )
    db.commit()
    return count
