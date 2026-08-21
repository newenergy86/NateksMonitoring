\# Nateks Monitoring — Milestone 2026-08-21



\## Достигнуто



Рабочая интеграция старых коммутаторов NetXpert NXI-3030

с Zabbix через NateksLegacyAdapter.



\## NateksLegacyAdapter



Адаптер находится в отдельном репозитории:



newenergy86/NateksLegacyAdapter



Рабочая ветка:



feature/web-provider



Актуальный зафиксированный commit:



9c6c33d



\## Проверка адаптера



Discovery:



legacy\_adapter.py --discovery 10.0.110.28



Возвращает 9 VLAN:



1, 15, 20, 30, 40, 50, 60, 150, 777



Проверка VLAN:



legacy\_adapter.py --vlan 20 10.0.110.28



Результат:



83 80



Проверка VLAN:



legacy\_adapter.py --vlan 40 10.0.110.28



Результат:



43 80



\## Zabbix



NateksLegacyAdapter установлен на Zabbix Server:



/usr/lib/zabbix/externalscripts/legacy\_adapter.py



Скрипт успешно запускается от пользователя zabbix.



Discovery rule:



Legacy VLAN discovery



Тип:



External check



Ключ:



legacy\_adapter.py\[--discovery,{HOST.CONN}]



Discovery успешно обнаруживает VLAN.



\## LLD



Создан prototype:



VLAN {#VLANID} Bitmap



Тип:



External check



Ключ:



legacy\_adapter.py\[--vlan,{#VLANID},{HOST.CONN}]



Zabbix автоматически создаёт элементы для обнаруженных VLAN.



Пример реального элемента:



VLAN 20 Bitmap



Ключ:



legacy\_adapter.py\[--vlan,20,{HOST.CONN}]



Полученное значение:



83 80



\## Полученные значения



VLAN 1   -> 0F 80

VLAN 15  -> 13 80

VLAN 20  -> 83 80

VLAN 30  -> 03 80

VLAN 40  -> 43 80

VLAN 50  -> 23 80

VLAN 60  -> 03 80

VLAN 150 -> 03 80

VLAN 777 -> 03 80



\## Архитектура



NXI-3030 Legacy

&nbsp;       |

&nbsp;       | HTTP

&nbsp;       v

NateksLegacyAdapter

&nbsp;       |

&nbsp;       | External check

&nbsp;       v

Zabbix

&nbsp;       |

&nbsp;       | LLD

&nbsp;       v

VLAN bitmap items



\## Следующий этап



Добавить получение и мониторинг состояния портов

для каждой VLAN:



\- Tagged

\- Untagged

\- Not member



После этого добавить обнаружение VLAN/Port и

контроль изменений конфигурации.



\## Важно



IP 10.0.110.28 используется только как тестовый хост.



В рабочей конфигурации IP не должен быть зашит

в адаптер или discovery rule.



Используется:



{HOST.CONN}

