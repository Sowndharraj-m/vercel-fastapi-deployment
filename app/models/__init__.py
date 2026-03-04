# Models package – import all models to ensure they register with SQLAlchemy Base
from app.models.item import ItemModel, ItemCreate, ItemUpdate, ItemResponse  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.person import Person  # noqa: F401
from app.models.offer import OfferTemplate, OfferLetter  # noqa: F401
from app.models.onboarding import OnboardingSubmission  # noqa: F401
from app.models.document import Document  # noqa: F401
from app.models.attendance import AttendanceRecord  # noqa: F401
from app.models.compensation import CompensationProfile, Payout, Payslip  # noqa: F401
from app.models.audit_log import AuditLog  # noqa: F401
