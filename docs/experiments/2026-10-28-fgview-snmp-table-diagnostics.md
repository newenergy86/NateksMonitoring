# Журнал диагностики FGView Manager / SNMP Table — 2026-10-28

## Цель
Восстановить корректную работу SNMP-таблицы коммутатора Nateks/NetXpert. В ходе работы выяснилось, что исследуется штатный FGView Manager и его SNMP-инструменты. Цель не в том, чтобы строить обходной мониторинг, а понять, почему штатная таблица работает неправильно, и восстановить её.

## Итог на конец дня
**Проблема не решена. Прошивка не выполнялась.** Причина сбоя SNMP Table пока не установлена. Нельзя считать, что проблема в самом коммутаторе: также возможна проблема в механизме FGView/его запросах или конфигурации.

## Что установлено на сервере Windows

Путь установки: `C:\FGView Manager`.

### Аппаратный ключ
- Без специального USB-ключа приложение сообщало, что ключ не найден.
- После подключения найденного специального USB-ключа FGView Manager открылся.
- В каталоге имеется текстовый файл с идентификатором ключа `FGVMQ25082019EX`.
- Ключ обеспечивает запуск приложения, но сам по себе ничего не говорит о причине сбоя SNMP Table.

### Компоненты FGView
В `C:\FGView Manager\gui` присутствуют:
- `QTablesGui.exe` — GUI-таблицы;
- `modsnmp.exe`;
- `modsnmpget.exe`;
- `modsnmpgetnext.exe`;
- `modsnmpset.exe`;
- `modsnmptable.exe`;
- `modsnmp-async.ini`;
- `gnclient.ini`;
- каталог `mibs3050`, в котором есть стандартные MIB и Nateks MIB: `NATEKS-SMI.MIB`, `NXI-ALARM.MIB`, `NXI-DEV.MIB`, `NXI-LLDP.MIB`, `NXI-PORT.MIB`, `NXI-SLOT.MIB`.

В каталоге GUI отсутствует `nxi3050-card.ini`, хотя `C:\FGView Manager\nxi3050.bat` пытается запускать:
```bat
cd .\nxi3050
start QTablesGui.exe -ini nxi3050-card.ini -ip %1 -cr %2 -cw %3
```
В GUI обнаружен шаблон `gui\template\nxi3050-card.svg`. Это несоответствие стоит учитывать, но пока не доказано, что именно оно вызывает проблему.

### Пробы запуска SNMP-утилит
Из каталога `C:\FGView Manager\gui`:
- `modsnmpget.exe --help` возвращает `NO IP(X.X.X.X) DEVICE`;
- `modsnmptable.exe --help` возвращает `NO IP(X.X.X.X) DEVICE`;
- `modsnmpget.exe 10.0.110.10` возвращает `No community name specified.`;
- `modsnmpget.exe 10.0.110.10 pubsheksna` также возвращает `No community name specified.`;
- вызов `modsnmpget.exe 10.0.110.10 x` также возвращает `No community name specified.`.

Следовательно, синтаксис запуска этих утилит пока не установлен: IP и имя community, переданные позиционно, не распознаются как достаточные аргументы. Ответы не являются доказательством неисправности SNMP на коммутаторе.

Поиск строк `modsnmpget`, `modsnmptable`, `modsnmp` в INI/BAT-файлах GUI не нашёл вызывающих команд, кроме секции `[ModSnmp]` в `modsnmp-async.ini`.

### Конфигурация клиента и SNMP-сервера
`C:\FGView Manager\gui\modsnmp-async.ini`:
- `snmp_server_addr = 127.0.0.1`
- `snmp_server_port = 8893`
- `ext_values = 0`

На сервере существует отдельный файл `C:\FGView Manager\modsnmp.ini`:
```ini
[POLLING]
save_dir=
save_ip=
sleep_request=10
time_polling_modsnmp=10
time_polling_modsnmpget=10
time_polling_modsnmpset=10
time_polling_modsnmptable=10
```
Само наличие этого файла не доказывает, что параметры корректны или что это активная причина сбоя.

### FGV-AsyncSNMP
Файл `C:\FGView Manager\fgvasyncsnmp.ini` указывает:
- версия `3.3.1.2`;
- `MainServIP = 127.0.0.1`;
- `tcp_listen_port = 8893`;
- `appdir = C:/FGView Manager/fgvasyncsnmp`;
- `logdir = C:/FGView Manager/fgvasyncsnmp/logs`;
- `mibdir = C:/FGView Manager/MIBS`;
- `device_poll_timeout = 5`;
- `device_poll_retries = 2`;
- `log_level = 2`;
- `corba_port_nms = 8887`.

В выводе PowerShell служба `FGV-AsyncSNMP` находится в состоянии Running, процесс `fgvasyncsnmp.exe` имеет PID 3104 и слушает TCP-порт 8893 на `::`.

### FGV-Poll
Служба `FGV-Poll` работает; процесс `fgvpoll.exe` PID 3156. Также обнаружен процесс `fgvpoll-config.exe` PID 8048.

Файл `C:\FGView Manager\fgvpoll\fgvpoll.ini`:
- `HomeDir = C:/FGView Manager/fgvpoll`;
- `mainserver_host = 127.0.0.1`;
- `snmpserver_host = 127.0.0.1`;
- `snmpserver_port = 8893`.

Файл `pollxmlconfig.ini` указывает `MibDir="./MIBS"`, `TestDeviceIP="127.0.0.1"`, а также параметры скрытия/сворачивания веток MIB. Найдены XML-файлы `pollxml\fgfomms16.xml`, `fgfomms16c.xml`, `fgfomms64.xml`. Пока не подтверждено, что эти файлы относятся к проблемной таблице коммутатора.

### Логи
В `C:\FGView Manager\fgvasyncsnmp\logs` имеются ежедневные логи до 28.10.2026, включая `asnmp-20261028-101954.log` (около 10 МБ).

Выполненный поиск:
```powershell
Select-String -Path "C:\FGView Manager\fgvasyncsnmp\logs\asnmp-20261028-101954.log" -Pattern "10.0.110.10" | Select-Object -First 20
```
Результат пустой. Это означает только, что буквальная строка IP не найдена в указанном файле; причина неизвестна.

### Сетевые порты и процессы
На сервере IP `10.0.110.11`:
- PID 3104 `fgvasyncsnmp.exe` слушает 8893 и 8889;
- PID 1156 `NMSMainServer` слушает 8887 на адресе `10.0.110.11`;
- PID 5116 `SnmpServer.exe` слушает 8890 на `127.0.0.1`;
- PID 1648 `TrandSNMPLocalServ.exe` слушает 20111 на `127.0.0.1`;
- PID 3012 `GLDS` слушает порты 3185, 3186, 3187;
- запущены службы `FGV-AsyncSNMP`, `FGV-Poll`, `FGV-ServiceHolder`.

Проверка:
```powershell
Test-NetConnection 127.0.0.1 -Port 8887
```
дала `TcpTestSucceeded: False`.

Проверка:
```powershell
Test-NetConnection 10.0.110.11 -Port 8887
```
дала `TcpTestSucceeded: True`.

Это подтверждает, что NMS-сервис слушает порт 8887 на адресе LAN, но не на IPv4 loopback 127.0.0.1. Однако причинная связь этого факта с неисправностью SNMP Table не доказана. Не менять адреса сервисов без подтверждения архитектуры и зависимостей.

## Что не было сделано / не подтверждено
- Прошивка коммутатора не выполнялась.
- Не получен достоверный вывод успешного SNMP GET/WALK именно с проблемной таблицы.
- Не установлен полный синтаксис `modsnmpget.exe` и `modsnmptable.exe`.
- Не доказано, что отсутствие `nxi3050-card.ini` является причиной.
- Не установлено, что проблема находится в прошивке самого коммутатора.
- Не следует повторять без необходимости уже выполненные проверки служб, портов, INI и списка файлов.

## Следующий шаг
Продолжить диагностику с фактической точки отказа штатной SNMP Table:
1. Зафиксировать точную модель коммутатора, IP, имя community (не публиковать секреты) и точное проявление ошибки в GUI/таблице.
2. Установить поддерживаемый синтаксис запуска штатных `modsnmpget`/`modsnmptable` из документации, ресурсов программы или анализа строк/ресурсов бинарников; не угадывать параметры командной строки.
3. Выполнить корректный запрос к одному и тому же OID/таблице штатным инструментом и независимым SNMP-клиентом, сохранить команду и полный ответ.
4. Сравнить результаты: ответ устройства, способ интерпретации таблицы в FGView, либо конфигурация/привязка GUI.
5. Только после локализации причины решать вопрос о перепрошивке. Если она понадобится, предварительно подтвердить точную модель, текущую версию, подходящий образ, процедуру восстановления и резервное копирование конфигурации.

## Важное рабочее правило
Не утверждать, что проблема решена, пока нет фактического успешного результата. Отдельно отмечать: «проверено», «наблюдение», «гипотеза», «не подтверждено». Не возвращаться к повторению уже пройденных проверок без нового основания.
