import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";

using TypeSpec.Http;
using TypeSpec.Rest;

@service(#{
  title: "CalKing API",
})
@server("http://localhost:3000", "Local development server")
@route("/api")
namespace CalKingApi;

/**
 * Единственный заранее заданный владелец календаря. В приложении нет регистрации и входа.
 */
@example(#{
  id: "owner_default",
  name: "Александр Пушкин",
  timezone: "Europe/Moscow",
})
model CalendarOwner {
  /** Идентификатор владельца. */
  id: string;

  /** Отображаемое имя владельца. */
  name: string;

  /** Часовой пояс календаря, например Europe/Moscow. */
  timezone: string;
}

/**
 * Тип встречи, который гости могут забронировать на публичной странице бронирования.
 */
@example(#{
  id: "intro_call_30",
  title: "Знакомство",
  description: "Короткая встреча, чтобы обсудить цели и следующие шаги.",
  durationMinutes: 30,
  ownerId: "owner_default",
})
model EventType {
  /** Идентификатор типа события. */
  id: string;

  /** Название события, отображаемое гостям. */
  title: string;

  /** Описание события, отображаемое гостям. */
  description: string;

  /** Длительность встречи в минутах. Используется для расчета слотов и времени окончания бронирования. */
  durationMinutes: int32;

  /** Идентификатор заранее заданного владельца календаря. */
  ownerId: string;
}

/**
 * Данные для создания типа события в административной части владельца.
 */
@example(#{
  title: "Продуктовая стратегия",
  description: "Подробная сессия планирования для продуктовой команды.",
  durationMinutes: 60,
})
model CreateEventTypeRequest {
  title: string;
  description: string;
  durationMinutes: int32;
}

/**
 * Данные для частичного обновления типа события в административной части владельца.
 */
@example(#{
  title: "Обновленное знакомство",
  durationMinutes: 45,
})
model UpdateEventTypeRequest {
  title?: string;
  description?: string;
  durationMinutes?: int32;
}

/**
 * Конкретное рассчитанное время начала для типа события.
 * Слоты формируются динамически на ближайшие 14 дней от текущей даты.
 */
@example(#{
  startAt: utcDateTime.fromISO("2026-05-04T09:00:00Z"),
  endAt: utcDateTime.fromISO("2026-05-04T09:30:00Z"),
  eventTypeId: "intro_call_30",
  durationMinutes: 30,
  isAvailable: true,
})
model Slot {
  /** Дата и время начала слота. */
  startAt: utcDateTime;

  /** Дата и время окончания слота. */
  endAt: utcDateTime;

  /** Тип события, для которого рассчитан слот. */
  eventTypeId: string;

  /** Длительность слота, скопированная из выбранного типа события. */
  durationMinutes: int32;

  /** True, только если на это же время не существует бронирования. */
  isAvailable: boolean;
}

/**
 * Подтвержденное бронирование гостя.
 */
@example(#{
  id: "booking_01JZ8Q9N4W8X7Y6Z5A4B3C2D1E",
  eventTypeId: "intro_call_30",
  ownerId: "owner_default",
  guestName: "Эдмон Дантес",
  guestContact: "sam.taylor@example.com",
  startAt: utcDateTime.fromISO("2026-05-04T09:00:00Z"),
  endAt: utcDateTime.fromISO("2026-05-04T09:30:00Z"),
  createdAt: utcDateTime.fromISO("2026-04-25T12:15:00Z"),
})
model Booking {
  /** Идентификатор бронирования. */
  id: string;

  /** Выбранный тип события. */
  eventTypeId: string;

  /** Идентификатор заранее заданного владельца календаря. */
  ownerId: string;

  /** Имя гостя, введенное без регистрации аккаунта. */
  guestName: string;

  /** Контакт гостя, например email или телефон. */
  guestContact: string;

  /** Дата и время начала встречи. */
  startAt: utcDateTime;

  /** Дата и время окончания встречи, рассчитанные как startAt плюс длительность типа события. */
  endAt: utcDateTime;

  /** Дата и время создания бронирования. */
  createdAt: utcDateTime;
}

/**
 * Данные для создания гостевого бронирования. Сервер рассчитывает endAt по длительности типа события.
 */
@example(#{
  eventTypeId: "intro_call_30",
  startAt: utcDateTime.fromISO("2026-05-04T09:00:00Z"),
  guestName: "Эдмон Дантес",
  guestContact: "sam.taylor@example.com",
})
model CreateBookingRequest {
  /** Тип события, выбранный гостем. */
  eventTypeId: string;

  /** Начало свободного слота, выбранного гостем в пределах ближайших 14 дней. */
  startAt: utcDateTime;

  /** Имя гостя. */
  guestName: string;

  /** Контакт гостя, например email или телефон. */
  guestContact: string;
}

/**
 * Query-параметры для запроса рассчитанных слотов.
 */
model ListSlotsQuery {
  /** Необязательная нижняя граница начала слота. По умолчанию текущие дата и время. */
  @query
  from?: utcDateTime;

  /** Необязательная верхняя граница начала слота. Не должна превышать 14 дней от текущей даты. */
  @query
  to?: utcDateTime;
}

/**
 * Query-параметры для списка бронирований владельца.
 */
model ListOwnerBookingsQuery {
  /** Необязательная нижняя граница начала бронирования. По умолчанию текущие дата и время. */
  @query
  from?: utcDateTime;

  /** Необязательная верхняя граница начала бронирования. */
  @query
  to?: utcDateTime;
}

@error
model BadRequestError {
  @statusCode
  statusCode: 400;

  code: "bad_request";
  message: string;
}

@error
model NotFoundError {
  @statusCode
  statusCode: 404;

  code: "not_found";
  message: string;
}

@error
model SlotUnavailableError {
  @statusCode
  statusCode: 409;

  code: "slot_unavailable";
  message: string;
}

interface PublicBookingOperations {
  /**
   * Получить список типов событий, доступных гостям на публичной странице бронирования.
   */
  @opExample(#{
    returnType: #[
      #{
        id: "intro_call_30",
        title: "Знакомство",
        description: "Короткая встреча, чтобы обсудить цели и следующие шаги.",
        durationMinutes: 30,
        ownerId: "owner_default",
      },
      #{
        id: "product_strategy_60",
        title: "Продуктовая стратегия",
        description: "Подробная сессия планирования для продуктовой команды.",
        durationMinutes: 60,
        ownerId: "owner_default",
      },
    ],
  })
  @route("/event-types")
  @get
  listEventTypes(): EventType[];

  /**
   * Получить список динамически рассчитанных слотов для типа события.
   * Возвращаются только слоты в пределах ближайших 14 дней.
   * Слот доступен только если на это же время нет бронирования, независимо от типа события.
   */
  @opExample(#{
    parameters: #{
      eventTypeId: "intro_call_30",
    },
    returnType: #[
      #{
        startAt: utcDateTime.fromISO("2026-05-04T09:00:00Z"),
        endAt: utcDateTime.fromISO("2026-05-04T09:30:00Z"),
        eventTypeId: "intro_call_30",
        durationMinutes: 30,
        isAvailable: true,
      },
      #{
        startAt: utcDateTime.fromISO("2026-05-04T09:30:00Z"),
        endAt: utcDateTime.fromISO("2026-05-04T10:00:00Z"),
        eventTypeId: "intro_call_30",
        durationMinutes: 30,
        isAvailable: false,
      },
    ],
  })
  @opExample(#{
    parameters: #{
      eventTypeId: "missing_event_type",
    },
    returnType: #{
      statusCode: 404,
      code: "not_found",
      message: "Тип события не найден.",
    },
  })
  @route("/event-types/{eventTypeId}/slots")
  @get
  listSlots(
    @path eventTypeId: string,
    ...ListSlotsQuery,
  ): Slot[] | NotFoundError | BadRequestError;

  /**
   * Создать гостевое бронирование без регистрации и входа.
   * Сервер должен повторно проверить доступность слота перед созданием бронирования.
   */
  @opExample(#{
    parameters: #{
      booking: #{
        eventTypeId: "intro_call_30",
        startAt: utcDateTime.fromISO("2026-05-04T09:00:00Z"),
        guestName: "Эдмон Дантес",
        guestContact: "sam.taylor@example.com",
      },
    },
    returnType: #{
      id: "booking_01JZ8Q9N4W8X7Y6Z5A4B3C2D1E",
      eventTypeId: "intro_call_30",
      ownerId: "owner_default",
      guestName: "Эдмон Дантес",
      guestContact: "sam.taylor@example.com",
      startAt: utcDateTime.fromISO("2026-05-04T09:00:00Z"),
      endAt: utcDateTime.fromISO("2026-05-04T09:30:00Z"),
      createdAt: utcDateTime.fromISO("2026-04-25T12:15:00Z"),
    },
  })
  @opExample(#{
    parameters: #{
      booking: #{
        eventTypeId: "intro_call_30",
        startAt: utcDateTime.fromISO("2026-05-04T09:30:00Z"),
        guestName: "Эдмон Дантес",
        guestContact: "sam.taylor@example.com",
      },
    },
    returnType: #{
      statusCode: 409,
      code: "slot_unavailable",
      message: "Выбранный слот больше недоступен.",
    },
  })
  @route("/bookings")
  @post
  createBooking(@body booking: CreateBookingRequest): Booking | NotFoundError | BadRequestError | SlotUnavailableError;
}

interface OwnerOperations {
  /**
   * Получить профиль заранее заданного владельца календаря, используемый административной частью.
   */
  @opExample(#{
    returnType: #{
      id: "owner_default",
      name: "Александр Пушкин",
      timezone: "Europe/Moscow",
    },
  })
  @route("/owner")
  @get
  getOwner(): CalendarOwner;

  /**
   * Получить список предстоящих бронирований, видимых владельцу, независимо от типа события.
   */
  @opExample(#{
    returnType: #[
      #{
        id: "booking_01JZ8Q9N4W8X7Y6Z5A4B3C2D1E",
        eventTypeId: "intro_call_30",
        ownerId: "owner_default",
        guestName: "Эдмон Дантес",
        guestContact: "sam.taylor@example.com",
        startAt: utcDateTime.fromISO("2026-05-04T09:00:00Z"),
        endAt: utcDateTime.fromISO("2026-05-04T09:30:00Z"),
        createdAt: utcDateTime.fromISO("2026-04-25T12:15:00Z"),
      },
      #{
        id: "booking_01JZ9K2M3N4P5Q6R7S8T9V0W1X",
        eventTypeId: "product_strategy_60",
        ownerId: "owner_default",
        guestName: "Наталья Гончарова",
        guestContact: "+1-555-0104",
        startAt: utcDateTime.fromISO("2026-05-05T13:00:00Z"),
        endAt: utcDateTime.fromISO("2026-05-05T14:00:00Z"),
        createdAt: utcDateTime.fromISO("2026-04-25T14:40:00Z"),
      },
    ],
  })
  @route("/owner/bookings")
  @get
  listOwnerBookings(...ListOwnerBookingsQuery): Booking[] | BadRequestError;

  /**
   * Получить список типов событий, которыми управляет заранее заданный владелец.
   */
  @opExample(#{
    returnType: #[
      #{
        id: "intro_call_30",
        title: "Знакомство",
        description: "Короткая встреча, чтобы обсудить цели и следующие шаги.",
        durationMinutes: 30,
        ownerId: "owner_default",
      },
      #{
        id: "product_strategy_60",
        title: "Продуктовая стратегия",
        description: "Подробная сессия планирования для продуктовой команды.",
        durationMinutes: 60,
        ownerId: "owner_default",
      },
    ],
  })
  @route("/owner/event-types")
  @get
  listOwnerEventTypes(): EventType[];

  /**
   * Создать тип события в административной части владельца.
   */
  @opExample(#{
    parameters: #{
      eventType: #{
        title: "Продуктовая стратегия",
        description: "Подробная сессия планирования для продуктовой команды.",
        durationMinutes: 60,
      },
    },
    returnType: #{
      id: "product_strategy_60",
      title: "Продуктовая стратегия",
      description: "Подробная сессия планирования для продуктовой команды.",
      durationMinutes: 60,
      ownerId: "owner_default",
    },
  })
  @route("/owner/event-types")
  @post
  createEventType(@body eventType: CreateEventTypeRequest): EventType | BadRequestError;

  /**
   * Частично обновить тип события в административной части владельца.
   */
  @opExample(#{
    parameters: #{
      eventTypeId: "intro_call_30",
      eventType: #{
        title: "Обновленное знакомство",
        durationMinutes: 45,
      },
    },
    returnType: #{
      id: "intro_call_30",
      title: "Обновленное знакомство",
      description: "Короткая встреча, чтобы обсудить цели и следующие шаги.",
      durationMinutes: 45,
      ownerId: "owner_default",
    },
  })
  @opExample(#{
    parameters: #{
      eventTypeId: "missing_event_type",
      eventType: #{
        title: "Обновленное знакомство",
      },
    },
    returnType: #{
      statusCode: 404,
      code: "not_found",
      message: "Тип события не найден.",
    },
  })
  @route("/owner/event-types/{eventTypeId}")
  @patch
  updateEventType(
    @path eventTypeId: string,
    @body eventType: UpdateEventTypeRequest,
  ): EventType | NotFoundError | BadRequestError;

  /**
   * Удалить тип события в административной части владельца.
   */
  @route("/owner/event-types/{eventTypeId}")
  @delete
  deleteEventType(@path eventTypeId: string): void | NotFoundError;
}
