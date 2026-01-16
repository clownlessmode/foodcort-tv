export function clearLocalStorage() {
    if (typeof window === "undefined") return;

    const now = new Date().getTime();
    const fourAM = new Date().setHours(4, 0, 0, 0);

    // Если еще не 4:00, ничего не делаем
    if (now < fourAM) return;

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const lastClearDateStr = localStorage.getItem("lastClearDate");

    // Если нет последней очистки, устанавливаем текущую дату
    if (!lastClearDateStr) {
      localStorage.setItem("lastClearDate", today.toISOString());
      return;
    }

    const lastClearDate = new Date(lastClearDateStr);
    lastClearDate.setHours(0, 0, 0, 0);

    // Если последняя очистка была не сегодня, очищаем localStorage
    if (lastClearDate.getTime() < today.getTime()) {
      localStorage.clear();
      localStorage.setItem("lastClearDate", today.toISOString());
      console.log("LocalStorage очищен в 4:00");
    }
}
