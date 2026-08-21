\# Nateks Monitoring — Monitoring Model





\## 1. Назначение





Nateks Monitoring предназначен для мониторинга сетевых устройств NetXpert NXI-3030, включая устройства со старой версией прошивки, не предоставляющей необходимые данные через современный интерфейс мониторинга.





Система должна обеспечивать:





\- обнаружение устройств и их ресурсов;

\- мониторинг VLAN;

\- мониторинг принадлежности портов к VLAN;

\- мониторинг состояния портов;

\- обнаружение изменений конфигурации;

\- передачу событий в Zabbix;

\- отображение состояния оборудования в Dashboard.





---





\# 2. Архитектура





Система состоит из нескольких независимых компонентов.



&nbsp;                  NetXpert NXI-3030

&nbsp;                         |

&nbsp;                   HTTP / SNMP

&nbsp;                         |

&nbsp;            +------------+------------+

&nbsp;            |                         |

&nbsp;            v                         v

&nbsp;     NateksLegacyAdapter           SNMP

&nbsp;            |                         |

&nbsp;            | External check          |

&nbsp;            +------------+------------+

&nbsp;                         |

&nbsp;                         v

&nbsp;                      Zabbix

&nbsp;                         |

&nbsp;            +------------+------------+

&nbsp;            |                         |

&nbsp;            v                         v

&nbsp;        Discovery                 Items

&nbsp;            |                         |

&nbsp;            +------------+------------+

&nbsp;                         |

&nbsp;                         v

&nbsp;                   Nateks Monitoring

&nbsp;                      Dashboard



Основные компоненты:



NateksLegacyAdapter



Отвечает за работу со старым Web-интерфейсом NXI-3030 и преобразование полученных данных в простой интерфейс, пригодный для использования Zabbix.



Адаптер находится в отдельном репозитории:



newenergy86/NateksLegacyAdapter



Zabbix



Отвечает за:



discovery;

хранение значений;

item prototypes;

triggers;

историю;

обработку изменений;

оповещения.

Dashboard



Отвечает за визуальное представление состояния оборудования и результатов мониторинга.



Dashboard находится в репозитории:



newenergy86/NateksMonitoring



\## 3. Device



Устройство является основной единицей мониторинга.



Для каждого устройства Zabbix должен знать:



IP-адрес;

имя устройства;

тип устройства;

версию/тип прошивки;

доступность;

доступные интерфейсы мониторинга.



IP-адрес устройства не должен быть жёстко записан в NateksLegacyAdapter.



Для передачи адреса устройства используется:



{HOST.CONN}



Это позволяет использовать один и тот же шаблон Zabbix для нескольких устройств.



\## 4. VLAN



VLAN является отдельным объектом мониторинга.



Для каждого устройства должна выполняться автоматическая обнаружение VLAN.



Текущий механизм:



Legacy VLAN discovery



Ключ:



legacy\_adapter.py\[--discovery,{HOST.CONN}]



Результатом является LLD JSON:



\[

&nbsp; {"{#VLANID}":"1"},

&nbsp; {"{#VLANID}":"15"},

&nbsp; {"{#VLANID}":"20"}

]



Для каждого обнаруженного VLAN Zabbix создаёт соответствующие элементы мониторинга.



\## 5. VLAN Bitmap



Bitmap представляет принадлежность портов к VLAN в компактном виде.



Текущий Zabbix prototype:



VLAN {#VLANID} Bitmap



Ключ:



legacy\_adapter.py\[--vlan,{#VLANID},{HOST.CONN}]



Пример:



VLAN 20 -> 83 80



Bitmap используется как машинное представление состояния VLAN.



Он не должен считаться единственным источником семантической информации о портах.



\## 6. VLAN Membership



Для каждого VLAN необходимо определять принадлежность портов.



Поддерживаемые состояния:



Tagged

Untagged

Not member

Unknown



Пример:



VLAN 20





Port 1 -> Untagged

Port 7 -> Tagged

Port 8 -> Tagged

Port 9 -> Tagged



Получение этой информации для Legacy NXI-3030 выполняется через NateksLegacyAdapter.



\## 7. Port



Порт является отдельным объектом мониторинга.



Для NXI-3030 количество и номера портов должны определяться фактической конфигурацией устройства.



Для каждого порта потенциально могут контролироваться:



наличие линка;

скорость;

duplex;

состояние;

VLAN membership;

Tagged/Untagged;

входящий трафик;

исходящий трафик;

ошибки.



Конкретный набор контролируемых параметров определяется возможностями конкретной прошивки и доступных интерфейсов.



\## 8. Port Discovery



Порты должны обнаруживаться автоматически, если это возможно.



Предполагаемый LLD:



{#PORT}



Пример:



Port 1

Port 2

Port 3

...

Port 10



Discovery портов не должен зависеть от конкретного IP устройства.



\## 9. VLAN / Port Relationship



Отдельным объектом мониторинга является связь:



VLAN <-> Port



Для неё необходимо знать:



VLAN ID

Port

Membership state



где Membership state принимает значения:



Tagged

Untagged

Not member



Пример:



VLAN 20 / Port 1 -> Untagged

VLAN 20 / Port 7 -> Tagged

VLAN 20 / Port 8 -> Tagged

VLAN 20 / Port 9 -> Tagged



Эта модель является основой для обнаружения изменений конфигурации.



\## 10. Configuration Changes



Nateks Monitoring должен обнаруживать изменения конфигурации, которые могут влиять на работу сети.



Особенно важны изменения:



состава VLAN;

membership VLAN;

Tagged/Untagged состояния;

назначения access-портов;

trunk-портов.



Пример изменения:



До:





VLAN 20

Port 1 -> Untagged





После:





VLAN 20

Port 4 -> Untagged



Такое изменение должно рассматриваться как событие мониторинга.



\## 11. Discovery



Discovery используется для автоматического создания элементов мониторинга.



На первом этапе реализовано:



Device

&nbsp; |

&nbsp; +-- VLAN Discovery

&nbsp;       |

&nbsp;       +-- VLAN 1

&nbsp;       +-- VLAN 15

&nbsp;       +-- VLAN 20

&nbsp;       +-- ...



Следующий этап:



VLAN Discovery

&nbsp;     |

&nbsp;     +-- VLAN

&nbsp;           |

&nbsp;           +-- Port

&nbsp;           +-- Membership



Discovery должен быть максимально универсальным и не содержать конкретных IP-адресов устройств.



\## 12. Zabbix Items



Zabbix item является конечной точкой получения конкретного значения.



Пример текущего item:



VLAN 20 Bitmap



Ключ:



legacy\_adapter.py\[--vlan,20,{HOST.CONN}]



Результат:



83 80



В дальнейшем items должны предоставлять более семантически понятные значения там, где это возможно.



Например:



VLAN 20 / Port 1 / Membership

Untagged

\## 13. Triggers



Triggers должны реагировать не просто на наличие данных, а на изменение состояния.



Приоритетные события:



VLAN исчез



VLAN, ранее обнаруженный на устройстве, больше не существует.



VLAN появился



На устройстве появился новый VLAN.



VLAN membership изменился



Изменилось состояние порта относительно VLAN.



Port state changed



Изменилось состояние физического порта.



Device unavailable



Устройство перестало отвечать.



Конкретные выражения triggers определяются после завершения модели данных.



\## 14. Dashboard



Dashboard является визуальным слоем системы.



Он не должен самостоятельно получать данные с NXI-3030.



Источником данных для Dashboard является Zabbix.



NXI-3030

&nbsp;   |

&nbsp;   v

Adapter / SNMP

&nbsp;   |

&nbsp;   v

Zabbix

&nbsp;   |

&nbsp;   v

Dashboard



Dashboard должен отображать как минимум:



состояние устройств;

VLAN;

состояние портов;

VLAN membership;

изменения;

ошибки и события.

\## 15. Separation of Responsibilities



Компоненты системы должны сохранять чёткие границы ответственности.



NateksLegacyAdapter



Отвечает за:



авторизацию на Legacy Web-интерфейсе;

получение данных;

разбор HTML/ответов;

преобразование данных;

предоставление данных Zabbix.



Не отвечает за:



хранение истории;

triggers;

уведомления;

Dashboard;

бизнес-логику мониторинга.

Zabbix



Отвечает за:



discovery;

items;

history;

triggers;

events;

notifications.

Dashboard



Отвечает за:



визуализацию;

агрегирование отображаемых данных;

удобство оператора.

\## 16. Multi-device Support



Система должна поддерживать несколько NXI-3030 Legacy.



IP-адрес не должен быть частью программного кода адаптера.



Используется:



{HOST.CONN}



Пример:



Host A

{HOST.CONN} = 10.0.110.28





Host B

{HOST.CONN} = 10.0.110.39





Host C

{HOST.CONN} = 10.0.110.40



Один и тот же Zabbix template должен работать для всех этих устройств.



\## 17. Current Implementation Status



На момент создания документа реализовано и проверено:



Legacy VLAN Discovery



Работает.



Пример результата:



1

15

20

30

40

50

60

150

777

VLAN Bitmap



Работает.



Проверенные значения:



VLAN 1   -> 0F 80

VLAN 15  -> 13 80

VLAN 20  -> 83 80

VLAN 30  -> 03 80

VLAN 40  -> 43 80

VLAN 50  -> 23 80

VLAN 60  -> 03 80

VLAN 150 -> 03 80

VLAN 777 -> 03 80

Zabbix LLD



Работает.



Zabbix автоматически создаёт элементы:



VLAN 1 Bitmap

VLAN 15 Bitmap

VLAN 20 Bitmap

...

VLAN 777 Bitmap

Multi-device addressing



Используется:



{HOST.CONN}



IP конкретного устройства не зашит в Zabbix discovery rule или adapter.



\## 18. Next Development Stage



Следующий этап разработки:



VLAN / Port Membership Monitoring



Необходимо реализовать получение и представление:



VLAN

&nbsp; |

&nbsp; +-- Port

&nbsp;      |

&nbsp;      +-- Tagged

&nbsp;      +-- Untagged

&nbsp;      +-- Not member



После этого необходимо реализовать:



Port discovery.

VLAN/Port membership discovery.

Изменение membership.

Triggers для изменений.

Отображение изменений в Dashboard.



Новые функции должны добавляться поверх уже работающего:



Legacy VLAN Discovery



и



VLAN Bitmap



без нарушения существующей функциональности.



\## 19. Design Principle



Основной принцип проекта:



Сначала получить достоверную модель состояния устройства, затем строить мониторинг и визуализацию поверх этой модели.



NateksLegacyAdapter должен скрывать особенности старой прошивки.



Zabbix должен работать с нормализованными данными.



Dashboard должен работать с данными Zabbix.



Новые особенности конкретных прошивок не должны распространяться на остальные уровни системы.

