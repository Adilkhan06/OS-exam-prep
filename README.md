# OS Exam Prep

Платформа для подготовки к экзамену **Operating Systems** (Università degli Studi di Messina).
Все темы лекций и лабораторных — сжато, на русском с английскими терминами, с интерактивными визуализациями, тренировкой и режимом экзамена.

## Что внутри
- **13 модулей**: основы ОС, сервисы и структура ОС, процессы, потоки, планирование CPU, синхронизация, deadlock, I/O, mass storage, Linux basics, процессы в Linux, Bash, устройства в Linux.
- **Симуляторы**: CPU scheduling (FCFS/SJF/SRTF/RR/Priority), disk scheduling, Banker's algorithm, race condition, Peterson, семафоры, обедающие философы, fork-tree, закон Амдала, RAID + XOR-паритет, chmod и др.
- **Тренировка** по модулю/разделу с мгновенной проверкой и объяснениями, **карточки** терминов, **поиск**.
- **Экзамен**: выбор тем, количества и типа вопросов (теория / код), таймер, навигация, итог в % и по шкале /30, разбор, пересдача ошибок, история попыток.
- Прогресс хранится в `localStorage` браузера.

## Запуск локально
Сборка не нужна — это статический сайт.
```bash
python -m http.server 5173
```
и открыть http://localhost:5173 (или просто открыть `index.html`).

## Деплой на Vercel
Import репозитория → Framework Preset: **Other**, Build Command: пусто, Output Directory: `.` (корень).

## Структура
```
index.html          оболочка
css/styles.css      стили (светлая/тёмная тема)
js/core.js          роутер, хранилище, подсветка кода
js/viz/*.js         визуализации и симуляторы
js/learn.js         главная, модули, тренировка, карточки, поиск, ошибки
js/exam.js          режим экзамена и история
content/NN-*.js     контент модулей (OS.addModule)
docs/CONTENT_GUIDE.md  формат контента
tools/validate.js   проверка контента: node tools/validate.js
```
