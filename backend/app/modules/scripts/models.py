"""Script (answer booklet) models — upload through OCR pipeline."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Boolean,
    func,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.utils import new_id
from app.db.base import Base


class Script(Base):
    """An answer booklet (answer sheet) uploaded for evaluation.

    Lifecycle: uploaded → splitting → cleaning → segmenting →
               detecting → transcribing → ready → assigned → evaluated
    """

    __tablename__ = "scripts"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=new_id
    )
    paper_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("papers.id"), nullable=False, index=True
    )
    barcode: Mapped[str] = mapped_column(
        String(100), nullable=False, unique=True, index=True
    )
    storage_key: Mapped[str] = mapped_column(
        String(512), nullable=False
    )  # R2 key for original PDF
    page_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[str] = mapped_column(
        Enum(
            "uploaded",
            "splitting",
            "cleaning",
            "segmenting",
            "detecting",
            "transcribing",
            "ready",
            "assigned",
            "evaluation_in_progress",
            "evaluated",
            "in_moderation",
            "finalized",
            name="script_status",
        ),
        default="uploaded",
        nullable=False,
        index=True,
    )
    processing_error: Mapped[str] = mapped_column(Text, nullable=True, default=None)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    pages: Mapped[list["Page"]] = relationship(
        "Page", back_populates="script", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Script {self.barcode} status={self.status}>"


class Page(Base):
    """A single page image extracted from a script PDF."""

    __tablename__ = "pages"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=new_id
    )
    script_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("scripts.id"), nullable=False, index=True
    )
    page_number: Mapped[int] = mapped_column(Integer, nullable=False)
    storage_key: Mapped[str] = mapped_column(
        String(512), nullable=False
    )  # R2 key for cleaned page image
    storage_key_original: Mapped[str] = mapped_column(
        String(512), nullable=True
    )  # R2 key for raw page image (before cleaning)
    width: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    height: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    script: Mapped["Script"] = relationship("Script", back_populates="pages")
    regions: Mapped[list["Region"]] = relationship(
        "Region", back_populates="page", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Page {self.page_number} of script={self.script_id}>"


class Region(Base):
    """A detected answer region within a page.

    Maps to a specific question. Contains the OCR transcription
    and diagram detection results.
    """

    __tablename__ = "regions"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=new_id
    )
    page_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("pages.id"), nullable=False, index=True
    )
    question_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("questions.id"),
        nullable=True,
        index=True,
    )
    # Bounding box (percentage coordinates, 0–100)
    bbox_x: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    bbox_y: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    bbox_w: Mapped[float] = mapped_column(Float, nullable=False, default=100)
    bbox_h: Mapped[float] = mapped_column(Float, nullable=False, default=100)

    # OCR / transcription
    transcription: Mapped[str] = mapped_column(Text, nullable=False, default="")
    transcription_confidence: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0
    )
    language_detected: Mapped[str] = mapped_column(
        String(10), nullable=False, default="en"
    )

    # Diagram detection
    has_diagram: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    diagram_description: Mapped[str] = mapped_column(Text, nullable=False, default="")

    # Blank detection
    is_blank: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Storage key for the cropped region image
    storage_key: Mapped[str] = mapped_column(String(512), nullable=True)

    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    page: Mapped["Page"] = relationship("Page", back_populates="regions")

    def __repr__(self) -> str:
        return f"<Region page={self.page_id} question={self.question_id}>"
