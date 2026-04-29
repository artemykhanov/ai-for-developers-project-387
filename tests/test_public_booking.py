from playwright.sync_api import Page, expect


def test_guest_can_create_booking(page: Page, app_url: str) -> None:
    page.goto(app_url)

    expect(page.get_by_role("heading", name="CalKing")).to_be_visible()
    page.locator(".event-type-card", has_text="Знакомство").click()

    page.locator(".time-slot-button", has_text="Свободно").first.click()
    expect(page.get_by_role("dialog", name="Подтвердить бронирование")).to_be_visible()

    page.get_by_label("Имя").fill("Мария Иванова")
    page.get_by_label("Контакт").fill("maria@example.com")
    page.get_by_role("button", name="Забронировать").click()

    expect(page.get_by_text("Бронирование создано")).to_be_visible()
