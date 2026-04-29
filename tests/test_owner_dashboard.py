from uuid import uuid4

from playwright.sync_api import Page, expect


def test_owner_can_create_event_type(page: Page, app_url: str) -> None:
    event_title = f"Разбор проекта {uuid4().hex[:8]}"

    page.goto(f"{app_url}/owner")

    expect(page.get_by_text("Александр Пушкин")).to_be_visible()
    page.get_by_role("tab", name="Типы событий").click()
    page.get_by_role("button", name="Создать тип").click()

    expect(page.get_by_role("dialog", name="Создать тип события")).to_be_visible()
    page.get_by_label("Название").fill(event_title)
    page.get_by_label("Описание").fill("Подробный разбор текущего проекта и следующих шагов.")
    page.get_by_label("Длительность, минут").fill("45")
    page.get_by_role("button", name="Создать", exact=True).click()

    expect(page.get_by_text("Тип события создан")).to_be_visible()
    page.get_by_role("tab", name="Типы событий").click()
    expect(page.get_by_text(event_title)).to_be_visible()
