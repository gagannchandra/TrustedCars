import re
import sys

filepath = "/home/gagan-chandra/Code/TrustedCars/backend/app/modules/admin/services/moderation.py"

with open(filepath, 'r') as f:
    content = f.read()

# 1. suspend_user (cascade hide cars)
suspend_user_target = """        target.is_suspended = True

        try:
            await self._dispatch_and_audit("""
suspend_user_replacement = """        target.is_suspended = True

        if target.role.value == "dealer":
            from sqlalchemy import update as sa_update
            stmt = select(Dealership).where(Dealership.user_id == target.id, Dealership.deleted_at.is_(None))
            result = await self.session.execute(stmt)
            dealer = result.scalars().first()
            if dealer:
                now = datetime.now(timezone.utc)
                await self.session.execute(
                    sa_update(Car)
                    .where(Car.dealership_id == dealer.id, Car.deleted_at.is_(None))
                    .values(
                        previous_moderation_status=Car.moderation_status,
                        moderation_status=ModerationStatusEnum.hidden.value,
                        moderated_at=now,
                        moderated_by=actor.id,
                        moderation_reason=f"Dealer suspended: {reason}",
                    )
                )

        try:
            await self._dispatch_and_audit("""
content = content.replace(suspend_user_target, suspend_user_replacement)

# 2. suspend_dealer ("hidden" to Enum)
suspend_dealer_target = """                previous_moderation_status=Car.moderation_status,
                moderation_status="hidden",
                moderated_at=now,"""
suspend_dealer_replacement = """                previous_moderation_status=Car.moderation_status,
                moderation_status=ModerationStatusEnum.hidden.value,
                moderated_at=now,"""
content = content.replace(suspend_dealer_target, suspend_dealer_replacement)

# 3. restore_dealer ("hidden" to Enum)
restore_dealer_target = """        stmt = select(Car).where(
            Car.dealership_id == dealer_id,
            Car.moderation_status == "hidden",
            Car.deleted_at.is_(None),
        )"""
restore_dealer_replacement = """        stmt = select(Car).where(
            Car.dealership_id == dealer_id,
            Car.moderation_status == ModerationStatusEnum.hidden.value,
            Car.deleted_at.is_(None),
        )"""
content = content.replace(restore_dealer_target, restore_dealer_replacement)

# 4. moderate_car (FEATURE precondition)
moderate_car_target = """        elif action_upper == "FEATURE":
            car.is_featured = True"""
moderate_car_replacement = """        elif action_upper == "FEATURE":
            if car.moderation_status != ModerationStatusEnum.approved.value:
                raise CustomException(409, "Only approved cars can be featured")
            car.is_featured = True"""
content = content.replace(moderate_car_target, moderate_car_replacement)

# 5. Exception handling
# We use regex to find:
#         except Exception as e:
#             await self.session.rollback()
#             raise CustomException(500, f"Failed to {action}: {str(e)}")
# and replace with structlog version.

def replacer(match):
    action_text = match.group(1)
    return f'''        except Exception as e:
            await self.session.rollback()
            import structlog
            structlog.get_logger(__name__).error("Failed to {action_text}", error=str(e), exc_info=True)
            raise CustomException(500, "An internal error occurred. Please try again.")'''

pattern = r'        except Exception as e:\n\s+await self\.session\.rollback\(\)\n\s+raise CustomException\(500, f"Failed to ([^"]+): \{str\(e\)\}"\)'
content = re.sub(pattern, replacer, content)

with open(filepath, 'w') as f:
    f.write(content)

print("Refactored moderation.py")
