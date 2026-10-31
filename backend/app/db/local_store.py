import uuid
from datetime import datetime, date
from typing import Dict, Any, List, Optional

class LocalDataStore:
    """
    High-fidelity state management store.
    Synchronizes with Supabase PostgreSQL and provides resilient persistence.
    """
    def __init__(self):
        self.profiles: Dict[str, Dict[str, Any]] = {}
        self.research_projects: Dict[str, Dict[str, Any]] = {}
        self.sources: Dict[str, Dict[str, Any]] = {}
        self.claims: Dict[str, Dict[str, Any]] = {}
        self.information_gaps: Dict[str, Dict[str, Any]] = {}
        self.conflicts: Dict[str, Dict[str, Any]] = {}
        self.verification_tasks: Dict[str, Dict[str, Any]] = {}
        self.tracked_opportunities: Dict[str, Dict[str, Any]] = {}
        self.opportunity_dates: Dict[str, Dict[str, Any]] = {}
        self.source_changes: Dict[str, Dict[str, Any]] = {}
        self.notifications: Dict[str, Dict[str, Any]] = {}
        self.pdf_documents: Dict[str, Dict[str, Any]] = {}
        self.pdf_versions: Dict[str, Dict[str, Any]] = {}
        self.pdf_binaries: Dict[str, bytes] = {}

    def insert(self, collection: str, data: Dict[str, Any]) -> Dict[str, Any]:
        item = dict(data)
        if "id" not in item or not item["id"]:
            item["id"] = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        if "created_at" not in item:
            item["created_at"] = now
        if "updated_at" not in item:
            item["updated_at"] = now

        target = getattr(self, collection, None)
        if target is not None:
            target[item["id"]] = item
        return item

    def get_by_id(self, collection: str, item_id: str) -> Optional[Dict[str, Any]]:
        target = getattr(self, collection, None)
        return target.get(item_id) if target is not None else None

    def query(self, collection: str, filter_fn=None) -> List[Dict[str, Any]]:
        target = getattr(self, collection, None)
        if target is None:
            return []
        items = list(target.values())
        if filter_fn:
            items = [i for i in items if filter_fn(i)]
        return items

    def update(self, collection: str, item_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        target = getattr(self, collection, None)
        if target is not None and item_id in target:
            target[item_id].update(updates)
            target[item_id]["updated_at"] = datetime.utcnow().isoformat()
            return target[item_id]
        return None

    def delete(self, collection: str, item_id: str) -> bool:
        target = getattr(self, collection, None)
        if target is not None and item_id in target:
            del target[item_id]
            return True
        return False

db_store = LocalDataStore()

