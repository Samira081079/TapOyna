import { Language } from '../types/tapoyna';

export interface TranslationBundle {
  nav: {
    sandbox: string;
    qa: string;
    ledger: string;
    policy: string;
    reset: string;
  };
  hero: {
    title: string;
    subtitle: string;
    pilotBadge: string;
  };
  timeMachine: {
    bakuClock: string;
    utcClock: string;
    cutoffLabel: string;
    freeCancelUntil: string;
    jumpPlus5m: string;
    jumpExpireHold: string;
    jumpT6: string;
    jumpT4: string;
    jumpT30m: string;
    jumpKickoff: string;
    jumpEnd: string;
    jumpArchive: string;
    phaseBeforeT6: string;
    phaseT6ToT4: string;
    phaseT4ToT0: string;
    phaseInProgress: string;
    phasePostMatch: string;
    phaseArchived: string;
  };
  roles: {
    player: string;
    venue: string;
    operator: string;
    actingAs: string;
  };
  stateMachine: {
    slotLifecycle: string;
    matchLifecycle: string;
    activeState: string;
  };
  pitch: {
    title: string;
    occupiedOf: string;
    minRequired: string;
    seatHeader: string;
    participantHeader: string;
    statusHeader: string;
    paymentHeader: string;
    checkinHeader: string;
    holdCountdown: string;
    guestLabel: string;
    inviteCopy: string;
    openReplacement: string;
    seatFree: string;
    seatHold: string;
    seatPaid: string;
    seatCancelled: string;
    checkinPending: string;
    checkinDone: string;
    checkinNoShow: string;
    checkinDisputed: string;
  };
  playerPanel: {
    catalogTitle: string;
    filterAll: string;
    filterFree: string;
    filterAlmostFull: string;
    districtAll: string;
    bookingTitle: string;
    seatsToBook: string;
    fullPitchBuyout: string;
    rentShare: string;
    serviceFee: string;
    totalDue: string;
    termsNotice: string;
    activateAndLock: string;
    lockMoreSeats: string;
    simulateRace: string;
    webhookPanelTitle: string;
    pendingHoldInfo: string;
    webhookSuccess: string;
    webhookFail: string;
    webhookDuplicate: string;
    webhookLateAfterExpiry: string;
    topUpTitle: string;
    topUpPrompt: string;
    topUpAgree: string;
    topUpDecline: string;
    topUpAgreedLabel: string;
    topUpDeclinedLabel: string;
    mySeatsTitle: string;
    cancelSeat: string;
    cancelAfterT4Hint: string;
    buyReplacementSeat: string;
    waitlistTitle: string;
    joinWaitlist: string;
    acceptWaitlistOffer: string;
    waitlistEmpty: string;
    chatTitle: string;
    chatLockedHint: string;
    chatArchivedHint: string;
    chatPlaceholder: string;
    chatSend: string;
    qrPassTitle: string;
    disputeNoShow: string;
    ratingsTitle: string;
    submitRating: string;
  };
  venuePanel: {
    calendarTitle: string;
    createSlot: string;
    attemptExternalBlock: string;
    cancelByVenue: string;
    cancelReasonPlaceholder: string;
    confirmVenueCancel: string;
    markUnavailable: string;
    restoreAvailable: string;
    applyDiscount: string;
    qrScannerTitle: string;
    scanQrBtn: string;
    manualCheckinBtn: string;
    ledgerTitle: string;
    grossRent: string;
    platformFee: string;
    providerFee: string;
    payableToVenue: string;
    payoutStatus: string;
  };
  operatorPanel: {
    paymentsTitle: string;
    retryRefund: string;
    flagDispute: string;
    adminCancelBtn: string;
    disputesTitle: string;
    approveDispute: string;
    rejectDispute: string;
    invariantsTitle: string;
  };
  telemetry: {
    coverageTitle: string;
    collectedBase: string;
    committedTopUp: string;
    remainingDeficit: string;
    fullyCovered: string;
    qaSuiteTitle: string;
    runTest: string;
    auditLogTitle: string;
    clearFilter: string;
    emptyAudit: string;
  };
  policy: {
    title: string;
    subtitle: string;
    saveClose: string;
  };
  invariants: {
    inv1: string;
    inv2: string;
    inv3: string;
    inv4: string;
    inv5: string;
    inv6: string;
    inv7: string;
    inv8: string;
  };
}

export const TRANSLATIONS: Record<Language, TranslationBundle> = {
  ru: {
    nav: {
      sandbox: 'Песочница',
      qa: 'QA-сценарии',
      ledger: 'Реестр выплат',
      policy: 'Параметры D01–D09',
      reset: 'Сбросить симулятор',
    },
    hero: {
      title: 'Симулятор жизненного цикла матчей и платежей TapOyna',
      subtitle: 'Баку · Мини-футбол 5×5 (10 мест) · Расчёт в целых qəpik · Контрольный рубеж T–4 часа',
      pilotBadge: 'Спецификация v1.0 · Пилот Баку',
    },
    timeMachine: {
      bakuClock: 'Время Asia/Baku',
      utcClock: 'Хранение UTC',
      cutoffLabel: 'Рубеж T–4ч',
      freeCancelUntil: 'Бесплатная отмена до',
      jumpPlus5m: '+5 мин',
      jumpExpireHold: '+10м (Истечение HOLD)',
      jumpT6: 'Перейти к T–6ч',
      jumpT4: 'Запустить T–4ч (Cutoff)',
      jumpT30m: 'К T–30м (Закрытие замен)',
      jumpKickoff: 'Начало игры (T–0)',
      jumpEnd: 'Финиш матча (+1ч)',
      jumpArchive: 'Архив чата (+24ч)',
      phaseBeforeT6: 'Открытый набор до T–6ч',
      phaseT6ToT4: 'Окно согласий на доплату (T–6ч … T–4ч)',
      phaseT4ToT0: 'После рубежа T–4ч (замены до T–30м)',
      phaseInProgress: 'Идёт игра · Окно QR-чек-ина',
      phasePostMatch: 'Матч завершён · Оценки и расчёт выплаты',
      phaseArchived: 'Завершён · Чат в режиме чтения',
    },
    roles: {
      player: 'Игрок / Инициатор',
      venue: 'Владелец площадки',
      operator: 'Оператор TapOyna',
      actingAs: 'Активный профиль',
    },
    stateMachine: {
      slotLifecycle: 'Состояние слота (Slot)',
      matchLifecycle: 'Состояние матча (Match)',
      activeState: 'Текущее состояние',
    },
    pitch: {
      title: 'Поле 5×5 и распределение 10 мест',
      occupiedOf: 'Оплачено мест',
      minRequired: 'Мин. порог',
      seatHeader: 'Место',
      participantHeader: 'Участник',
      statusHeader: 'Статус места',
      paymentHeader: 'Сумма (qəpik)',
      checkinHeader: 'QR-чек-ин',
      holdCountdown: 'HOLD истекает через',
      guestLabel: 'Гость',
      inviteCopy: 'Ссылка гостя',
      openReplacement: 'Доступно для замены до T–30м',
      seatFree: 'Свободно',
      seatHold: 'Удержание (HOLD)',
      seatPaid: 'Оплачено',
      seatCancelled: 'Отменено',
      checkinPending: 'Ожидает явки',
      checkinDone: 'Явка подтверждена',
      checkinNoShow: 'Неявка (NO_SHOW)',
      checkinDisputed: 'Оспорено игроком',
    },
    playerPanel: {
      catalogTitle: 'Каталог слотов Баку',
      filterAll: 'Все слоты',
      filterFree: 'Свободные (FREE)',
      filterAlmostFull: 'Почти полные (8–9/10)',
      districtAll: 'Все районы',
      bookingTitle: 'Активация и бронирование мест',
      seatsToBook: 'Количество мест',
      fullPitchBuyout: 'Выкуп всего поля (10/10)',
      rentShare: 'Аренда за места',
      serviceFee: 'Сервисный сбор (раскрыто до оплаты)',
      totalDue: 'Итого к оплате',
      termsNotice: 'Возврат 100% при отмене до рубежа T–4ч или при отмене по вине площадки. После T–4ч возврат только при успешной замене до T–30м.',
      activateAndLock: 'Создать HOLD на 10 мин (POST /holds)',
      lockMoreSeats: 'Забронировать места (HOLD 10 мин)',
      simulateRace: 'Симулировать гонку за 10-е место (AT-02)',
      webhookPanelTitle: 'Шлюз провайдера (Webhook источник истины)',
      pendingHoldInfo: 'Ожидание 3-D Secure и подписанного webhook от провайдера',
      webhookSuccess: 'Webhook: SUCCEEDED',
      webhookFail: 'Webhook: FAILED',
      webhookDuplicate: 'Повторить Webhook (Дубль)',
      webhookLateAfterExpiry: 'Поздний Webhook после истечения HOLD',
      topUpTitle: 'Запрос доплаты в T–6 часов',
      topUpPrompt: 'Макс. доплата при недоборе до 10 мест. Молчание приравнивается к отказу.',
      topUpAgree: 'Согласиться на доплату',
      topUpDecline: 'Отказаться от доплаты',
      topUpAgreedLabel: 'Согласие зафиксировано',
      topUpDeclinedLabel: 'Отказ от доплаты',
      mySeatsTitle: 'Управление записями и заменами',
      cancelSeat: 'Отменить место',
      cancelAfterT4Hint: 'После T–4ч возврат блокируется до замены новым игроком до T–30м.',
      buyReplacementSeat: 'Выкупить освободившееся место (замена)',
      waitlistTitle: 'Очередь ожидания (Waitlist · TTL 15 мин)',
      joinWaitlist: 'Встать в Waitlist',
      acceptWaitlistOffer: 'Принять приглашение из Waitlist',
      waitlistEmpty: 'Очередь пуста. Появляется при заполнении 10/10 или после поздней отмены.',
      chatTitle: 'Временный чат матча',
      chatLockedHint: 'Чат открывается исключительно после подтверждения матча (CONFIRMED в T–4ч).',
      chatArchivedHint: 'Прошло 24 часа после матча — чат переведён в режим чтения.',
      chatPlaceholder: 'Написать участникам матча...',
      chatSend: 'Отправить',
      qrPassTitle: 'Персональные QR-токены участников',
      disputeNoShow: 'Оспорить неявку (NO_SHOW)',
      ratingsTitle: 'Оценка игры и площадки',
      submitRating: 'Отправить отзыв',
    },
    venuePanel: {
      calendarTitle: 'Календарь слотов площадки и защита мягкого резерва',
      createSlot: 'Добавить FREE-слот',
      attemptExternalBlock: 'Попытаться закрыть под внешнего клиента',
      cancelByVenue: 'Официальная отмена площадкой (CANCEL_BY_VENUE)',
      cancelReasonPlaceholder: 'Укажите обязательную причину отмены (напр., авария освещения)...',
      confirmVenueCancel: 'Отменить матч и вернуть 100% игрокам',
      markUnavailable: 'Пометить UNAVAILABLE (погода/техпричина)',
      restoreAvailable: 'Восстановить доступность (FREE)',
      applyDiscount: 'Скидка площадки на дефицит',
      qrScannerTitle: 'Контроль QR-чек-ина на входе',
      scanQrBtn: 'Сканировать QR',
      manualCheckinBtn: 'Ручной чек-ин (аудит)',
      ledgerTitle: 'Финансовый реестр площадки (Ledger)',
      grossRent: 'Валовая аренда',
      platformFee: 'Комиссия TapOyna',
      providerFee: 'Эквайринг',
      payableToVenue: 'К выплате площадке',
      payoutStatus: 'Статус выплаты',
    },
    operatorPanel: {
      paymentsTitle: 'Реестр платежей, возвратов и идемпотентности',
      retryRefund: 'Перезапустить возврат',
      flagDispute: 'Chargeback / Спор',
      adminCancelBtn: 'Административная отмена (CANCELLED_ADMIN)',
      disputesTitle: 'Разбор споров по неявке (NO_SHOW)',
      approveDispute: 'Подтвердить явку игрока',
      rejectDispute: 'Оставить NO_SHOW',
      invariantsTitle: 'Монитор 8 бизнес-инвариантов системы',
    },
    telemetry: {
      coverageTitle: 'Финансовое покрытие слота',
      collectedBase: 'Оплачено мест (база)',
      committedTopUp: 'Согласованные доплаты',
      remainingDeficit: 'Дефицит до 100%',
      fullyCovered: '100% покрытие подтверждено',
      qaSuiteTitle: 'Приёмочные тесты спецификации (AT-01 … AT-12)',
      runTest: 'Запустить',
      auditLogTitle: 'Журнал событий, webhook и аудита',
      clearFilter: 'Все события',
      emptyAudit: 'Событий пока нет — начните сценарий в песочнице.',
    },
    policy: {
      title: 'Реестр продуктовых решений (D01–D09)',
      subtitle: 'Изменяйте параметры пилота для проверки граничных сценариев.',
      saveClose: 'Применить и закрыть',
    },
    invariants: {
      inv1: 'Отсутствие двойных броней на пересекающееся время',
      inv2: 'Количество PAID + HOLD мест ≤ вместимости (10)',
      inv3: 'Место PAID только после подтверждённого webhook',
      inv4: 'CONFIRMED только при 100% покрытии стоимости аренды',
      inv5: 'Доплата не превышает max_amount_minor с явным согласием',
      inv6: 'Полная трассируемость всех транзакций и выплат',
      inv7: 'Идемпотентность webhook и клиентских запросов',
      inv8: 'Условия отмены и сборов раскрыты до момента оплаты',
    },
  },
  az: {
    nav: {
      sandbox: 'Simulyator',
      qa: 'QA ssenarilər',
      ledger: 'Maliyyə reyestri',
      policy: 'Qərarlar D01–D09',
      reset: 'Sıfırla',
    },
    hero: {
      title: 'TapOyna Oyun və Ödəniş Həyat Dövrü Simulyatoru',
      subtitle: 'Bakı · Mini-futbol 5×5 (10 yer) · Tam qəpik hesablaması · T–4 saat nəzarət həddi',
      pilotBadge: 'Spesifikasiya v1.0 · Bakı Pilotu',
    },
    timeMachine: {
      bakuClock: 'Asia/Baku vaxtı',
      utcClock: 'UTC bazası',
      cutoffLabel: 'Hədd T–4s',
      freeCancelUntil: 'Pulsuz ləğv vaxtı:',
      jumpPlus5m: '+5 dəq',
      jumpExpireHold: '+10d (HOLD bitməsi)',
      jumpT6: 'T–6s-a keç',
      jumpT4: 'T–4s həddini işə sal',
      jumpT30m: 'T–30d (Əvəzləmə sonu)',
      jumpKickoff: 'Oyun başlanğıcı (T–0)',
      jumpEnd: 'Oyun sonu (+1s)',
      jumpArchive: 'Çat arxivi (+24s)',
      phaseBeforeT6: 'T–6s-a qədər açıq yığım',
      phaseT6ToT4: 'Əlavə ödəniş razılıq pəncərəsi (T–6s … T–4s)',
      phaseT4ToT0: 'T–4s sonrası (T–30d-yə qədər əvəzləmə)',
      phaseInProgress: 'Oyun gedir · QR yoxlanışı aktivdir',
      phasePostMatch: 'Oyun bitdi · Qiymətləndirmə və ödəniş',
      phaseArchived: 'Tamamlandı · Çat oxu-rejimindədir',
    },
    roles: {
      player: 'Oyunçu / Təşəbbüskar',
      venue: 'Meydança sahibi',
      operator: 'TapOyna Operatoru',
      actingAs: 'Aktiv rol',
    },
    stateMachine: {
      slotLifecycle: 'Slotun vəziyyət maşını (Slot)',
      matchLifecycle: 'Oyunun vəziyyət maşını (Match)',
      activeState: 'Cari status',
    },
    pitch: {
      title: '5×5 meydança və 10 yerin bölüşdürülməsi',
      occupiedOf: 'Ödənilmiş yer',
      minRequired: 'Min. hədd',
      seatHeader: 'Yer',
      participantHeader: 'İştirakçı',
      statusHeader: 'Status',
      paymentHeader: 'Məbləğ (qəpik)',
      checkinHeader: 'QR giriş',
      holdCountdown: 'HOLD bitir:',
      guestLabel: 'Qonaq',
      inviteCopy: 'Dəvət linki',
      openReplacement: 'T–30d-yə qədər əvəzləmə üçün açıqdır',
      seatFree: 'Boş',
      seatHold: 'Saxlanılıb (HOLD)',
      seatPaid: 'Ödənilib',
      seatCancelled: 'Ləğv edilib',
      checkinPending: 'Gözlənilir',
      checkinDone: 'Təsdiqləndi',
      checkinNoShow: 'Gəlmədi (NO_SHOW)',
      checkinDisputed: 'Etiraz edilib',
    },
    playerPanel: {
      catalogTitle: 'Bakı slotları kataloqu',
      filterAll: 'Hamısı',
      filterFree: 'Boş (FREE)',
      filterAlmostFull: 'Dolmağa yaxın (8–9/10)',
      districtAll: 'Bütün rayonlar',
      bookingTitle: 'Slot aktivasiyası və yer bronu',
      seatsToBook: 'Yer sayı',
      fullPitchBuyout: 'Bütün meydança (10/10)',
      rentShare: 'İcarə haqqı',
      serviceFee: 'Xidmət haqqı (ödənişdən əvvəl açıqlanır)',
      totalDue: 'Yekun məbləğ',
      termsNotice: 'T–4s-dan əvvəl ləğvdə və ya meydança səbəbindən ləğvdə 100% geri qaytarılır. T–4s sonrası yalnız T–30d-yə qədər əvəzləmə olduqda.',
      activateAndLock: '10 dəq HOLD yarat (POST /holds)',
      lockMoreSeats: 'Yerləri blokla (HOLD 10 dəq)',
      simulateRace: '10-cu yer üçün yarış simulyasiyası (AT-02)',
      webhookPanelTitle: 'Ödəniş şlüzü (Webhook həqiqət mənbəyi)',
      pendingHoldInfo: '3-D Secure və imzalanmış webhook gözlənilir',
      webhookSuccess: 'Webhook: SUCCEEDED',
      webhookFail: 'Webhook: FAILED',
      webhookDuplicate: 'Təkrar Webhook (Dublikat)',
      webhookLateAfterExpiry: 'HOLD bitdikdən sonra gecikmiş Webhook',
      topUpTitle: 'T–6 saatda əlavə ödəniş sorğusu',
      topUpPrompt: '10 yer dolmazsa maksimum əlavə ödəniş. Cavabsızlıq imtina sayılır.',
      topUpAgree: 'Əlavə ödənişə razıyam',
      topUpDecline: 'İmtina edirəm',
      topUpAgreedLabel: 'Razılıq təsdiqləndi',
      topUpDeclinedLabel: 'İmtina edildi',
      mySeatsTitle: 'Qeydlər və əvəzləmə',
      cancelSeat: 'Yeri ləğv et',
      cancelAfterT4Hint: 'T–4s sonrası qaytarılma T–30d-yə qədər yeni oyunçu tapılana kimi bloklanır.',
      buyReplacementSeat: 'Boşalmış yeri al (əvəzləmə)',
      waitlistTitle: 'Gözləmə növbəsi (Waitlist · 15 dəq)',
      joinWaitlist: 'Waitlist-ə qoşul',
      acceptWaitlistOffer: 'Waitlist təklifini qəbul et',
      waitlistEmpty: 'Növbə boşdur. 10/10 dolduqda aktivləşir.',
      chatTitle: 'Müvəqqəti oyun çatı',
      chatLockedHint: 'Çat yalnız oyun T–4s-da CONFIRMED olduqda açılır.',
      chatArchivedHint: 'Oyundan 24 saat keçdi — çat yalnız oxuma rejiminə keçdi.',
      chatPlaceholder: 'Oyunçulara mesaj yazın...',
      chatSend: 'Göndər',
      qrPassTitle: 'Fərdi QR giriş biletləri',
      disputeNoShow: 'NO_SHOW-a etiraz et',
      ratingsTitle: 'Oyun və meydança qiymətləndirməsi',
      submitRating: 'Rəy göndər',
    },
    venuePanel: {
      calendarTitle: 'Meydança təqvimi və yumşaq rezerv qoruması',
      createSlot: 'FREE slot əlavə et',
      attemptExternalBlock: 'Kənar müştəri üçün bağlamağa cəhd et',
      cancelByVenue: 'Meydança tərəfindən rəsmi ləğv (CANCEL_BY_VENUE)',
      cancelReasonPlaceholder: 'Məcburi ləğv səbəbini yazın (məs. işıq qəzası)...',
      confirmVenueCancel: 'Oyunu ləğv et və 100% geri qaytar',
      markUnavailable: 'UNAVAILABLE et (hava/texniki)',
      restoreAvailable: 'Bərpa et (FREE)',
      applyDiscount: 'Kəsiri meydança endirimi ilə bağla',
      qrScannerTitle: 'Girişdə QR yoxlanışı',
      scanQrBtn: 'QR skan et',
      manualCheckinBtn: 'Əl ilə qeydiyyat (audit)',
      ledgerTitle: 'Meydançanın maliyyə reyestri (Ledger)',
      grossRent: 'Ümumi icarə',
      platformFee: 'TapOyna komissiyası',
      providerFee: 'Ekvayrinq',
      payableToVenue: 'Meydançaya ödəniləcək',
      payoutStatus: 'Ödəniş statusu',
    },
    operatorPanel: {
      paymentsTitle: 'Ödənişlər, geri ödənişlər və idempotentlik',
      retryRefund: 'Geri ödənişi yenidən başlat',
      flagDispute: 'Chargeback / Mübahisə',
      adminCancelBtn: 'Operator ləğvi (CANCELLED_ADMIN)',
      disputesTitle: 'NO_SHOW mübahisələrinin araşdırılması',
      approveDispute: 'İştirakı təsdiqlə',
      rejectDispute: 'NO_SHOW saxla',
      invariantsTitle: '8 biznes-invariant monitoru',
    },
    telemetry: {
      coverageTitle: 'İcarə məbləğinin qarşılanması',
      collectedBase: 'Ödənilmiş yerlər (baza)',
      committedTopUp: 'Təsdiqlənmiş əlavə ödənişlər',
      remainingDeficit: '100%-ə çatmayan kəsir',
      fullyCovered: '100% təminat təsdiqləndi',
      qaSuiteTitle: 'Qəbul testləri (AT-01 … AT-12)',
      runTest: 'İcra et',
      auditLogTitle: 'Hadisə, webhook və audit jurnalı',
      clearFilter: 'Bütün hadisələr',
      emptyAudit: 'Hələ hadisə yoxdur — simulyatorda əməliyyat başladın.',
    },
    policy: {
      title: 'Məhsul qərarları reyestri (D01–D09)',
      subtitle: 'Sərhəd hallarını yoxlamaq üçün pilot parametrlərini tənzimləyin.',
      saveClose: 'Tətbiq et və bağla',
    },
    invariants: {
      inv1: 'Eyni vaxt üçün ikiqat bronlaşdırmanın olmaması',
      inv2: 'PAID + HOLD yerlərin sayı ≤ tutum (10)',
      inv3: 'Yer yalnız etibarlı webhook sonrası PAID olur',
      inv4: 'CONFIRMED yalnız 100% maliyyə təminatı olduqda',
      inv5: 'Əlavə ödəniş max_amount_minor limitini aşmır',
      inv6: 'Bütün ödəniş və çıxarışların tam izlənilməsi',
      inv7: 'Webhook və sorğuların idempotentliyi',
      inv8: 'Ləğv və komissiya şərtləri ödənişdən əvvəl açıqdır',
    },
  },
  en: {
    nav: {
      sandbox: 'Sandbox',
      qa: 'QA Suite',
      ledger: 'Venue Ledger',
      policy: 'Policy D01–D09',
      reset: 'Reset Sandbox',
    },
    hero: {
      title: 'TapOyna Match & Payment Lifecycle Simulator',
      subtitle: 'Baku · 5×5 Mini-Football (10 Seats) · Integer Qəpik Accounting · T–4h Cutoff Engine',
      pilotBadge: 'Specification v1.0 · Baku Pilot',
    },
    timeMachine: {
      bakuClock: 'Asia/Baku Time',
      utcClock: 'UTC Storage',
      cutoffLabel: 'Cutoff T–4h',
      freeCancelUntil: 'Free cancellation until',
      jumpPlus5m: '+5 min',
      jumpExpireHold: '+10m (Expire HOLD)',
      jumpT6: 'Jump to T–6h',
      jumpT4: 'Trigger T–4h Cutoff',
      jumpT30m: 'Jump to T–30m',
      jumpKickoff: 'Kickoff (T–0)',
      jumpEnd: 'Match End (+1h)',
      jumpArchive: 'Archive Chat (+24h)',
      phaseBeforeT6: 'Open registration before T–6h',
      phaseT6ToT4: 'Top-up consent window (T–6h … T–4h)',
      phaseT4ToT0: 'Post-cutoff (replacements open until T–30m)',
      phaseInProgress: 'Match in progress · QR check-in active',
      phasePostMatch: 'Completed · Ratings & venue payout',
      phaseArchived: 'Archived · Chat read-only',
    },
    roles: {
      player: 'Player / Initiator',
      venue: 'Venue Admin',
      operator: 'TapOyna Operator',
      actingAs: 'Active Persona',
    },
    stateMachine: {
      slotLifecycle: 'Slot State Machine',
      matchLifecycle: 'Match State Machine',
      activeState: 'Current State',
    },
    pitch: {
      title: '5×5 Pitch & 10-Seat Allocation',
      occupiedOf: 'Paid seats',
      minRequired: 'Min threshold',
      seatHeader: 'Seat',
      participantHeader: 'Participant',
      statusHeader: 'Seat Status',
      paymentHeader: 'Amount (qəpik)',
      checkinHeader: 'QR Check-in',
      holdCountdown: 'HOLD expires in',
      guestLabel: 'Guest',
      inviteCopy: 'Guest invite',
      openReplacement: 'Open for replacement until T–30m',
      seatFree: 'Free',
      seatHold: 'Hold (10m)',
      seatPaid: 'Paid',
      seatCancelled: 'Cancelled',
      checkinPending: 'Pending',
      checkinDone: 'Checked in',
      checkinNoShow: 'NO_SHOW',
      checkinDisputed: 'Disputed',
    },
    playerPanel: {
      catalogTitle: 'Baku Pitch Slot Catalog',
      filterAll: 'All Slots',
      filterFree: 'Free Only',
      filterAlmostFull: 'Nearly Full (8–9/10)',
      districtAll: 'All Districts',
      bookingTitle: 'Slot Activation & Seat Hold',
      seatsToBook: 'Seats to book',
      fullPitchBuyout: 'Full pitch buyout (10/10)',
      rentShare: 'Pitch rent share',
      serviceFee: 'Service fee (disclosed pre-pay)',
      totalDue: 'Total payable',
      termsNotice: '100% refund if cancelled before T–4h cutoff or by venue. After T–4h, refund applies only upon replacement before T–30m.',
      activateAndLock: 'Create 10m HOLD (POST /holds)',
      lockMoreSeats: 'Reserve Seats (10m HOLD)',
      simulateRace: 'Simulate 10th-Seat Race Condition (AT-02)',
      webhookPanelTitle: 'Payment Provider Gateway (Webhook Truth)',
      pendingHoldInfo: 'Awaiting 3-D Secure and signed provider webhook',
      webhookSuccess: 'Webhook: SUCCEEDED',
      webhookFail: 'Webhook: FAILED',
      webhookDuplicate: 'Replay Webhook (Duplicate)',
      webhookLateAfterExpiry: 'Late Webhook After HOLD Expiry',
      topUpTitle: 'T–6h Top-Up Consent Request',
      topUpPrompt: 'Maximum top-up if <10 players join. Silence equals decline.',
      topUpAgree: 'Consent to Top-Up',
      topUpDecline: 'Decline Top-Up',
      topUpAgreedLabel: 'Consent recorded',
      topUpDeclinedLabel: 'Declined',
      mySeatsTitle: 'Manage Participations & Replacements',
      cancelSeat: 'Cancel Seat',
      cancelAfterT4Hint: 'Post T–4h: no immediate refund; seat opens for replacement until T–30m.',
      buyReplacementSeat: 'Buy Replacement Seat',
      waitlistTitle: 'Waitlist Queue (15m Offer TTL)',
      joinWaitlist: 'Join Waitlist',
      acceptWaitlistOffer: 'Accept Waitlist Offer',
      waitlistEmpty: 'Queue is empty. Activates at 10/10 or after late cancellation.',
      chatTitle: 'Temporary Match Chat',
      chatLockedHint: 'Chat unlocks strictly after match transitions to CONFIRMED at T–4h.',
      chatArchivedHint: '24h post-match elapsed — chat is now read-only.',
      chatPlaceholder: 'Message match players...',
      chatSend: 'Send',
      qrPassTitle: 'Personal QR Check-in Tokens',
      disputeNoShow: 'Dispute NO_SHOW',
      ratingsTitle: 'Match & Venue Ratings',
      submitRating: 'Submit Rating',
    },
    venuePanel: {
      calendarTitle: 'Venue Slot Calendar & Soft-Reserve Protection',
      createSlot: 'Add FREE Slot',
      attemptExternalBlock: 'Attempt External Block Over Slot',
      cancelByVenue: 'Official Venue Cancel (CANCEL_BY_VENUE)',
      cancelReasonPlaceholder: 'Enter mandatory venue cancellation reason...',
      confirmVenueCancel: 'Cancel Match & Refund 100% to Players',
      markUnavailable: 'Mark UNAVAILABLE (Weather/Tech)',
      restoreAvailable: 'Restore Available (FREE)',
      applyDiscount: 'Venue Discount to Cover Deficit',
      qrScannerTitle: 'On-Site QR Check-in Scanner',
      scanQrBtn: 'Scan QR',
      manualCheckinBtn: 'Manual Check-in (Audited)',
      ledgerTitle: 'Venue Financial Ledger',
      grossRent: 'Gross Rent',
      platformFee: 'TapOyna Fee',
      providerFee: 'Acquiring Fee',
      payableToVenue: 'Payable to Venue',
      payoutStatus: 'Payout Status',
    },
    operatorPanel: {
      paymentsTitle: 'Payments, Refunds & Idempotency Registry',
      retryRefund: 'Retry Stuck Refund',
      flagDispute: 'Flag Chargeback',
      adminCancelBtn: 'Admin Cancel (CANCELLED_ADMIN)',
      disputesTitle: 'NO_SHOW Dispute Review',
      approveDispute: 'Confirm Attendance',
      rejectDispute: 'Uphold NO_SHOW',
      invariantsTitle: '8 Business Invariants Monitor',
    },
    telemetry: {
      coverageTitle: '100% Rent Coverage Meter',
      collectedBase: 'Base Seats Paid',
      committedTopUp: 'Committed Top-Ups',
      remainingDeficit: 'Remaining Deficit',
      fullyCovered: '100% rent coverage satisfied',
      qaSuiteTitle: 'Acceptance Test Suite (AT-01 … AT-12)',
      runTest: 'Run',
      auditLogTitle: 'Event, Webhook & Audit Stream',
      clearFilter: 'All Events',
      emptyAudit: 'No audit events yet — trigger an action in the sandbox.',
    },
    policy: {
      title: 'Product Decision Matrix (D01–D09)',
      subtitle: 'Adjust pilot parameters to test boundary conditions in real time.',
      saveClose: 'Apply & Close',
    },
    invariants: {
      inv1: 'Zero double bookings on overlapping slot time',
      inv2: 'PAID + HOLD seats never exceed capacity (10)',
      inv3: 'Seat becomes PAID only on verified webhook',
      inv4: 'CONFIRMED requires 100% rent financial coverage',
      inv5: 'Top-up never exceeds consented max_amount_minor',
      inv6: 'Full ledger traceability for refunds and payouts',
      inv7: 'Idempotent webhook & client hold handling',
      inv8: 'Cancellation and fee terms disclosed prior to pay',
    },
  },
};
