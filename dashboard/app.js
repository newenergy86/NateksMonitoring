const ZABBIX_URL = "http://10.0.110.5/zabbix/api_jsonrpc.php";
const TOKEN = "14bc83c01146476aedecef8cfc0eaffb58fa87bd2be239372657a1cb7e3b0f56";
const urlParams = new URLSearchParams(window.location.search);
const HOST_NAME = urlParams.get('host') || "NXI_3030_186";

let HOST_ID = null;
let HOST_IP = "";

let vlanBitmap = {};
let lastVlanUpdate = 0; 
let vlanBitmapLoaded = false;
let loading = false;
let portsCreated = false;
let DEVICE_MODEL = "";
const MAX_ERRORS = 3;
const portsContainer = document.getElementById("ports-container");
const uptimeDiv = document.getElementById("uptime");
const uplink1Speed = document.getElementById("uplink1-speed");
const uplink1Status = document.getElementById("uplink1-status");
const uplink2Speed = document.getElementById("uplink2-speed");
const uplink2Status = document.getElementById("uplink2-status");
const totalCount = document.getElementById("total-count");
const upCount = document.getElementById("up-count");
const downCount = document.getElementById("down-count");
const errorCount = document.getElementById("error-count");
const portElements = {}; // кеш DOM элементов
const lldpMap = {};
// Последние известные данные Legacy LLDP-соседей
const legacyNeighborCache = {};

// =====================================================
// NETWORK TOPOLOGY
// Узлы сети
// =====================================================

const NETWORK_NODES = [

    // =========================
    // Верхняя магистраль
    // =========================

    {
        id: "sw38",
        name: "sw38",
        sysName: null,
        zabbixHost: null,
        hostid: null,
        x: 80,
        y: 55
    },

    {
        id: "sw91",
        name: "sw91",
        sysName: null,
        zabbixHost: null,
        hostid: null,
        x: 200,
        y: 55
    },

    {
        id: "sw134",
        name: "sw134",
        sysName: null,
        zabbixHost: null,
        hostid: null,
        x: 320,
        y: 55
    },

    {
        id: "sw186",
        name: "sw186",
        sysName: "SWITCH186",
        zabbixHost: "NXI_3030_186",
        hostid: null,
        x: 440,
        y: 55
    },

    {
        id: "sw277",
        name: "sw277",
        sysName: "SWITCH277",
        zabbixHost: "NXI_3030_277",
        hostid: null,
        x: 560,
        y: 55
    },

    {
        id: "sw333",
        name: "sw333",
        sysName: null,
        zabbixHost: null,
        hostid: null,
        x: 700,
        y: 55
    },

    {
        id: "sw391",
        name: "sw391",
        sysName: null,
        zabbixHost: null,
        hostid: null,
        x: 820,
        y: 55
    },

    {
        id: "sw411",
        name: "sw411",
        sysName: null,
        zabbixHost: null,
        hostid: null,
        x: 940,
        y: 55
    },


    // =========================
    // Нижняя магистраль
    // =========================

    {
        id: "sw0",
        name: "sw0",
        sysName: null,
        zabbixHost: null,
        hostid: null,
        x: 80,
        y: 155
    },

    {
        id: "sw8",
        name: "sw8",
        sysName: null,
        zabbixHost: null,
        hostid: null,
        x: 200,
        y: 155
    },

    {
        id: "sw62",
        name: "sw62",
        sysName: null,
        zabbixHost: null,
        hostid: null,
        x: 320,
        y: 155
    },

    {
        id: "sw118",
        name: "sw118",
        sysName: "sw-3030-kp-118km",
        zabbixHost: "NXI_3030_118",
        hostid: null,
        x: 440,
        y: 155
    },

    {
        id: "sw161",
        name: "sw161",
        lldpNames: ["sw-3030-kp-162km"],
        sysName: "sw-3030-kp-162km",
        zabbixHost: "NXI_3030_161",
        hostid: null,
        x: 560,
        y: 155
    },

    {
        id: "sw209",
        name: "sw209",
        sysName: "SWITCH209",
        zabbixHost: "NXI_3030_209",
        hostid: null,
        x: 680,
        y: 155
    },

    {
        id: "sw253",
        name: "sw253",
        lldpNames: ["SWITCH252km"],
        sysName: "SWITCH252km",
        zabbixHost: "NXI_3030_253",
        hostid: null,
        x: 800,
        y: 155
    },

    {
        id: "sw305",
        name: "sw305",
        sysName: "SWITCH305",
        zabbixHost: "NXI_3030_305",
        hostid: null,
        x: 920,
        y: 155
    },

    {
        id: "sw362",
        name: "sw362",
        sysName: null,
        zabbixHost: null,
        hostid: null,
        x: 1020,
        y: 155
    },

    {
        id: "sw409",
        name: "sw409",
        sysName: null,
        zabbixHost: null,
        hostid: null,
        x: 1070,
        y: 155
    },

    {
        id: "sw412",
        name: "sw412",
        sysName: null,
        zabbixHost: null,
        hostid: null,
        x: 1120,
        y: 155
    },


    // =========================
    // Ответвления
    // =========================

    {
        id: "kirillov",
        name: "Kirillov",
        sysName: "sw-3030-grs-kirillov",
        lldpNames: ["sw-3030-grs-kirillov"],
        zabbixHost: "NXI_3030_GRS_Kirillov",
        hostid: null,
        x: 380,
        y: 225
    },

    {
        id: "lyp-bor",
        name: "Lyp Bor",
        sysName: "sw-3030-grs-lipinbor",
        lldpNames: ["sw-3030-grs-lipinbor"],
        zabbixHost: "NXI_3030_GRS_Lyp_Bor",
        hostid: null,
        x: 560,
        y: 225
    },

    {
        id: "vytegra",
        name: "Vytegra",
        sysName: "SWITCH-GRS-Vytegra",
        lldpNames: ["SWITCH-GRS-Vytegra"],
        zabbixHost: "NXI_3030_GRS_Vytegra",
        hostid: null,
        x: 860,
        y: 225
    }

];

// =====================================================
// NETWORK TOPOLOGY
// Связи между узлами
// =====================================================

const NETWORK_LINKS = [

    // =========================
    // Верхняя магистраль
    // =========================

    ["sw38", "sw91"],
    ["sw91", "sw134"],
    ["sw134", "sw186"],
    ["sw186", "sw277"],
    ["sw277", "sw333"],
    ["sw333", "sw391"],
    ["sw391", "sw411"],


    // =========================
    // Нижняя магистраль
    // =========================

    ["sw0", "sw8"],
    ["sw8", "sw62"],
    ["sw62", "sw118"],
    ["sw118", "sw161"],
    ["sw161", "sw209"],
    ["sw209", "sw253"],
    ["sw253", "sw305"],
    ["sw305", "sw362"],
    ["sw362", "sw409"],
    ["sw409", "sw412"],


    // =========================
    // Перемычки магистралей
    // =========================

    ["sw38", "sw0"],
    ["sw186", "sw118"],
    ["sw277", "sw209"],
    ["sw411", "sw412"],


    // =========================
    // Тупиковые ответвления
    // =========================

    ["sw118", "kirillov"],
    ["sw161", "lyp-bor"],
    ["sw253", "vytegra"]

];

// =====================================================
// DISCOVERED NETWORK LINKS
// Реальные связи, обнаруженные через LLDP
// =====================================================

function saveDiscoveredLinks(currentNodeId, neighborNodeIds, lldpDataValid) {

    if (!currentNodeId) {
        return;
    }

    const storageKey = "networkDiscoveredLinks";

    const now = Date.now();


    // =================================================
    // Загружаем сохранённые связи
    // =================================================

    let savedLinks = [];

    try {

        savedLinks = JSON.parse(
            localStorage.getItem(storageKey) || "[]"
        );

    }
    catch (error) {

        console.warn(
            "Cannot read discovered network links:",
            error
        );

        savedLinks = [];

    }


    // =================================================
    // Текущие LLDP-соседи этого коммутатора
    // =================================================

    const currentNeighbors = new Set(
        [...neighborNodeIds]
    );


    // =================================================
    // Создаём Map сохранённых связей
    // =================================================

    const linkMap = new Map();


    for (const link of savedLinks) {

        let from;
        let to;
        let lastSeen;


        // Старый формат:
        // ["sw186", "sw277"]

        if (Array.isArray(link)) {

            from = link[0];
            to = link[1];
            lastSeen = now;

        }


        // Новый формат:
        // {
        //     from: "sw186",
        //     to: "sw277",
        //     lastSeen: ...
        // }

        else if (
            link &&
            link.from &&
            link.to
        ) {

            from = link.from;
            to = link.to;
            lastSeen = link.lastSeen || now;

        }


        // Некорректная запись

        else {

            continue;

        }


        // =================================================
        // Проверяем:
        // относится ли сохранённая связь
        // к текущему коммутатору
        // =================================================

        const involvesCurrentSwitch =
            from === currentNodeId ||
            to === currentNodeId;


        if (
            involvesCurrentSwitch &&
            lldpDataValid === true
        ) {

            const otherNodeId =
                from === currentNodeId
                    ? to
                    : from;


            if (!currentNeighbors.has(otherNodeId)) {

                console.log(
                    "LLDP LINK REMOVED:",
                    currentNodeId,
                    "↔",
                    otherNodeId
                );

                continue;

            }

        }


        // =================================================
        // Сохраняем существующую актуальную связь
        // =================================================

        const key = [from, to]
            .sort()
            .join("|");


        linkMap.set(
            key,
            {
                from,
                to,
                lastSeen
            }
        );

    }


    // =================================================
    // Добавляем новые связи
    // или обновляем lastSeen существующих
    // =================================================

    for (const neighborNodeId of currentNeighbors) {

        if (neighborNodeId === currentNodeId) {
            continue;
        }


        const key = [
            currentNodeId,
            neighborNodeId
        ]
            .sort()
            .join("|");


        const existingLink =
            linkMap.get(key);


        if (existingLink) {

            // Связь подтверждена повторно

            existingLink.lastSeen = now;

        }
        else {

            // Обнаружена новая связь

            linkMap.set(
                key,
                {
                    from: currentNodeId,
                    to: neighborNodeId,
                    lastSeen: now
                }
            );


            console.log(
                "LLDP LINK ADDED:",
                currentNodeId,
                "↔",
                neighborNodeId
            );

        }

    }


    // =================================================
    // Сохраняем результат
    // =================================================

    const discoveredLinks = [
        ...linkMap.values()
    ];


    localStorage.setItem(
        storageKey,
        JSON.stringify(discoveredLinks)
    );


    console.log(
        "DISCOVERED NETWORK LINKS:",
        discoveredLinks
    );

}

// =====================================================
// NETWORK MAP
// Генерация SVG-карты сети
// =====================================================

function findNetworkNodeByLldpName(sysName) {

    if (!sysName) {
        return null;
    }

    const normalizedName =
        sysName
            .trim()
            .toLowerCase();


    // =============================================
    // 1. Сначала ищем точное LLDP-имя
    // =============================================

    const exactNode = NETWORK_NODES.find(node => {

        return node.lldpNames?.some(name =>
            name.trim().toLowerCase() === normalizedName
        );

    });


    if (exactNode) {
        return exactNode;
    }


    // =============================================
    // 2. Fallback для обычных SWITCH123 / kp123
    // =============================================

    const number =
        normalizedName.match(/\d+/)?.[0];


    if (number) {

        return NETWORK_NODES.find(
            node => node.id === `sw${number}`
        ) || null;

    }


    return null;

}

// =================================================
// Поиск узла карты по данным LLDP-соседа
//
// 1. Сначала ищем по sysName
// 2. Если не нашли — ищем Zabbix host по IP
// =================================================

function findNetworkNodeByNeighbor(neighbor) {

    if (!neighbor) {
        return null;
    }


    // =============================================
    // 1. Обычный LLDP: поиск по sysName
    // =============================================

    if (neighbor.sysName) {

        const nodeByName =
            findNetworkNodeByLldpName(
                neighbor.sysName
            );


        if (nodeByName) {

            return nodeByName;

        }

    }


    // =============================================
    // 2. Legacy LLDP: поиск по Neighbor IP
    // =============================================

    if (neighbor.ip) {

        const zabbixHostInfo =
            window.zabbixHostsByIp?.[
                neighbor.ip
            ];


        if (zabbixHostInfo) {

            const nodeByZabbixHost =
                NETWORK_NODES.find(node =>

                    node.zabbixHost ===
                    zabbixHostInfo.zabbixHost

                );


            if (nodeByZabbixHost) {

                console.log(
                    "LEGACY LLDP IP MAP:",
                    neighbor.ip,
                    "→",
                    zabbixHostInfo.zabbixHost,
                    "→",
                    nodeByZabbixHost.id
                );


                return nodeByZabbixHost;

            }

        }

    }


    return null;

}

// =================================================
// Получаем красивое имя Legacy LLDP-соседа по его IP
// =================================================

function getLegacyNeighborName(ip) {

    if (!ip) {
        return "";
    }


    // =============================================
    // Ищем IP в загруженном списке хостов Zabbix
    // =============================================

    const zabbixHostInfo =
        window.zabbixHostsByIp?.[ip];


    // Если такого IP нет в Zabbix,
    // оставляем IP вместо имени

    if (!zabbixHostInfo) {
        return ip;
    }


    // =============================================
    // Ищем соответствующий узел на нашей карте
    // =============================================

    const networkNode =
        NETWORK_NODES.find(node =>

            node.zabbixHost ===
            zabbixHostInfo.zabbixHost

        );


    // Если узел есть на карте,
    // используем его известное sysName

    if (networkNode?.sysName) {
        return networkNode.sysName;
    }


    // Если sysName в NETWORK_NODES нет,
    // используем видимое имя хоста из Zabbix

    if (zabbixHostInfo.name) {
        return zabbixHostInfo.name;
    }


    // Последний запасной вариант —
    // техническое имя хоста Zabbix

    if (zabbixHostInfo.zabbixHost) {
        return zabbixHostInfo.zabbixHost;
    }


    // Если ничего не нашли —
    // показываем IP

    return ip;

}

function renderNetworkMap() {

    const svg = document.getElementById("network-svg");

    if (!svg) {

        console.warn("NETWORK MAP: SVG #network-svg not found");

        return;

    }


    // =================================================
    // Создаём быстрый поиск узлов по ID
    // =================================================

    const nodeMap = {};

    NETWORK_NODES.forEach(node => {

        nodeMap[node.id] = node;

    });


    // =================================================
    // Группа линий
    // =================================================

    const linksGroup = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
    );

    linksGroup.setAttribute(
        "class",
        "network-links"
    );

    // =================================================
    // Группа подтверждённых LLDP-связей
    // =================================================

    const discoveredLinksGroup = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
    );

    discoveredLinksGroup.setAttribute(
        "class",
        "network-links-discovered"
    );

    // =================================================
    // Создаём линии
    // =================================================

    NETWORK_LINKS.forEach(link => {

        const fromNode = nodeMap[link[0]];
        const toNode = nodeMap[link[1]];


        if (!fromNode || !toNode) {

            console.warn(
                "NETWORK MAP: unknown link",
                link
            );

            return;

        }


        const line = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
        );


        line.setAttribute("x1", fromNode.x);
        line.setAttribute("y1", fromNode.y);

        line.setAttribute("x2", toNode.x);
        line.setAttribute("y2", toNode.y);


        linksGroup.appendChild(line);

    });


    // =================================================
    // Загружаем реальные LLDP-связи
    // =================================================

    const discoveredLinks = JSON.parse(
        localStorage.getItem("networkDiscoveredLinks") || "[]"
    );

    // =================================================
    // Все узлы, которые уже были обнаружены через LLDP
    // =================================================

    const discoveredNodeIds = new Set();

    for (const link of discoveredLinks) {

        if (link.from) {
            discoveredNodeIds.add(link.from);
        }

        if (link.to) {
            discoveredNodeIds.add(link.to);
        }

    }

    console.log(
        "NETWORK DISCOVERED NODES:",
        [...discoveredNodeIds]
    );

    // =================================================
    // Создаём подтверждённые LLDP-линии
    // =================================================

    discoveredLinks.forEach(link => {

        const fromNode = nodeMap[link.from];
        const toNode = nodeMap[link.to];


        if (!fromNode || !toNode) {

            console.warn(
                "NETWORK MAP: unknown discovered link",
                link
            );

            return;

        }


        const line = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
        );


        line.setAttribute("x1", fromNode.x);
        line.setAttribute("y1", fromNode.y);

        line.setAttribute("x2", toNode.x);
        line.setAttribute("y2", toNode.y);


        discoveredLinksGroup.appendChild(line);

    });

    // =================================================
    // Группа узлов
    // =================================================

    const nodesGroup = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
    );

    nodesGroup.setAttribute(
        "class",
        "network-nodes"
    );


    // =================================================
    // Создаём узлы
    // =================================================
    // =================================================
    // Определяем текущий узел карты
    // =================================================

    const currentHost =
        window.currentSwitch?.host || "";

    const currentMapNode =
        findNetworkNodeByLldpName(
            currentHost
        );

    const currentNodeId =
        currentMapNode
            ? currentMapNode.id
            : null;

    console.log(
        "NETWORK CURRENT HOST:",
        currentHost
    );

    console.log(
        "NETWORK CURRENT NODE:",
        currentNodeId
    );


    // =================================================
    // LLDP-соседи текущего коммутатора
    // =================================================

    const neighborNodeIds = new Set();

        for (const neighbor of (window.gxNeighbors || [])) {

        const mapNode =
            findNetworkNodeByNeighbor(
                neighbor
            );


        if (mapNode) {

            neighborNodeIds.add(
                mapNode.id
            );


            console.log(
                "LLDP MAP:",
                neighbor.sysName,
                neighbor.ip,
                "→",
                mapNode.id
            );

        }
        else {

            console.warn(
                "LLDP MAP: node not found:",
                neighbor.sysName,
                neighbor.ip
            );

        }

    }


    console.log(
        "NETWORK CURRENT:",
        currentNodeId
    );

    console.log(
        "NETWORK NEIGHBORS:",
        [...neighborNodeIds]
    );

    saveDiscoveredLinks(
        currentNodeId,
        neighborNodeIds,
        window.lldpDataValid === true
    );

    NETWORK_NODES.forEach(node => {

        const nodeGroup = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "g"
        );


        let nodeStatus = "unknown";


        // Текущий открытый коммутатор

        if (node.id === currentNodeId) {

            nodeStatus = "active";

        }


        // Непосредственный LLDP-сосед
        // текущего коммутатора

        else if (neighborNodeIds.has(node.id)) {

            nodeStatus = "neighbor";

        }


        // Узел ранее был реально
        // обнаружен через LLDP

        else if (discoveredNodeIds.has(node.id)) {

            nodeStatus = "discovered";

        }


        nodeGroup.setAttribute(
            "class",
            `network-node ${nodeStatus}`
        );


        nodeGroup.setAttribute(
            "transform",
            `translate(${node.x} ${node.y})`
        );


        nodeGroup.dataset.nodeId = node.id;

        // ---------------------------------------------
        // Click area
        // ---------------------------------------------

        const hitArea = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect"
        );

        hitArea.setAttribute("x", "-12");
        hitArea.setAttribute("y", "-16");

        hitArea.setAttribute("width", "95");
        hitArea.setAttribute("height", "32");

        hitArea.setAttribute(
            "class",
            "network-node-hit"
        );

        nodeGroup.appendChild(hitArea);

        // ---------------------------------------------
        // Переход к устройству Zabbix
        // ---------------------------------------------

        if (node.zabbixHost) {

            nodeGroup.addEventListener("click", () => {

                const url = new URL(window.location.href);

                url.searchParams.set(
                    "host",
                    node.zabbixHost
                );

                window.location.href = url.toString();

            });

        }

        // ---------------------------------------------
        // Circle
        // ---------------------------------------------

        const circle = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
        );

        circle.setAttribute("r", "7");


        // ---------------------------------------------
        // Text
        // ---------------------------------------------

        const text = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
        );

        text.setAttribute("x", "12");
        text.setAttribute("y", "5");

        text.textContent = node.name;


        // ---------------------------------------------
        // Собираем узел
        // ---------------------------------------------

        nodeGroup.appendChild(circle);

        nodeGroup.appendChild(text);

        nodesGroup.appendChild(nodeGroup);

    });


    // =================================================
    // Очищаем SVG
    // =================================================

    svg.innerHTML = "";


    // =================================================
    // Добавляем карту
    // =================================================

    svg.appendChild(linksGroup);

    svg.appendChild(discoveredLinksGroup);

    svg.appendChild(nodesGroup);


    console.log(
        "NETWORK MAP RENDERED:",
        NETWORK_NODES.length,
        "nodes,",
        NETWORK_LINKS.length,
        "links"
    );

}

async function zabbixRequest(method, params) {
    const response = await fetch(ZABBIX_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${TOKEN}`
        },
        body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 })
    });
    return await response.json();
}

function updateDeviceVersionRow(
    rowId,
    valueId,
    value
) {

    const row =
        document.getElementById(rowId);

    const valueElement =
        document.getElementById(valueId);


    if (!row || !valueElement) {
        return;
    }


    const cleanValue =
        String(value || "").trim();


    // Если значение существует —
    // показываем строку

    if (
        cleanValue &&
        cleanValue !== "--"
    ) {

        valueElement.innerText =
            cleanValue;

        row.style.display =
            "";

    }

    // Если item отсутствует или значения нет —
    // скрываем всю строку

    else {

        row.style.display =
            "none";

    }

}

async function loadZabbixHostsByIp() {

    const result = await zabbixRequest("host.get", {

        output: [
            "hostid",
            "host",
            "name"
        ],

        selectInterfaces: [
            "ip"
        ]

    });


    const hostsByIp = {};


    for (const host of (result.result || [])) {

        for (const iface of (host.interfaces || [])) {

            if (!iface.ip) {
                continue;
            }


            hostsByIp[iface.ip] = {

                hostid: host.hostid,

                // Техническое имя хоста Zabbix,
                // например NXI_3030_209
                zabbixHost: host.host,

                // Видимое имя хоста в Zabbix
                name: host.name,

                ip: iface.ip

            };

        }

    }


    window.zabbixHostsByIp = hostsByIp;


    console.log(
        "ZABBIX HOSTS BY IP:",
        window.zabbixHostsByIp
    );

}

function speedToText(speed) {
    let s = parseInt(speed) || 0;

    // Самые частые случаи для твоего свитча
    if (s >= 1000) return "1G";
    if (s >= 100)  return "100M";
    if (s >= 10)   return "10M";
    
    // Если приходит в битах
    if (s >= 1_000_000_000) return "1G";
    if (s >= 100_000_000)   return "100M";
    if (s >= 10_000_000)    return "10M";

    return "—";
}

function statusToClass(status, errors) {
    status = parseInt(status) || 2;
    errors = parseInt(errors) || 0;
    if (errors > 0) return "error";
    if (status === 1) return "up";
    return "down";
}

function duplexToText(v) {
    switch (parseInt(v)) {
        case 3: return "Full";
        case 2: return "Half";
        default: return "";
    }
}

function linkQuality(speed, duplex) {

    speed = parseInt(speed);
    duplex = parseInt(duplex);

    if (speed >= 1000 && duplex === 3)
        return "quality-good";

    if (speed >= 100 && duplex === 3)
        return "quality-medium";
    if (speed === 10 && duplex === 3)
        return "quality-warning";
    if (speed === 10 && duplex === 2)
        return "quality-bad";

    return "quality-unknown";
}

function vlanName(vlan) {

    vlan = parseInt(vlan);

    if (!Number.isFinite(vlan)) return "-";

    switch(vlan) {
        case 1: return "DFT";
        case 15: return "DMR";
        case 20: return "TM";
        case 30: return "TSO";
        case 40: return "CC";
        case 50: return "APZ";
        case 60: return "LSO";
        case 150: return "IP_TLF";
        case 777: return "MGMT";
        default:
            return "VLAN " + vlan;
    }
}

function parseVlanBitmap(raw) {

    if (!raw) return [];

    const clean = String(raw)
        .replace("Hex-STRING:", "")
        .trim();

    if (!clean) return [];

    const bytes = clean.split(/\s+/).map(b => parseInt(b, 16));

    if (bytes.some(isNaN)) return [];

    const vlans = [];

    bytes.forEach((byte, byteIndex) => {
        for (let bit = 0; bit < 8; bit++) {
            if (byte & (1 << (7 - bit))) {
                vlans.push(byteIndex * 8 + bit + 1);
            }
        }
    });

    return vlans;
}

function getTrunkVlansForPort(portIndex) {
    portIndex = Number(portIndex) - 1000000;

    const vlans = [];

    for (const vlanId in vlanBitmap) {

        const bitmap = vlanBitmap[vlanId];

        if (bitmap.includes(Number(portIndex))) {
            vlans.push(Number(vlanId));
        }
    }
    
    return vlans;
}

function vlanDisplay(port) {

    const mode = parseInt(port.vlanmode);

    if (mode === 2) {

        const trunkVlans = getTrunkVlansForPort(port.ifindex);

        if (!trunkVlans.length) {
            return `<span class="badge trunk">TRUNK</span>`;
        }

        const names = trunkVlans
            .map(vlanName)
            .join(", ");

        return `
            <span class="badge trunk">TRUNK </span>
        `;
    }

    const vlan = parseInt(port.vlan);

    if (!Number.isFinite(vlan)) {
        return `<span class="badge vlan">—</span>`;
    }

    return `<span class="badge vlan">${vlanName(vlan)}</span>`;
}

function vlanClass(vlan) {

    if (parseInt(vlan) === 1)
        return "vlan-vlan1";

    switch(parseInt(vlan)) {
        case 15: return "vlan-dmr";
        case 20: return "vlan-tm";
        case 30: return "vlan-tso";
        case 40: return "vlan-cc";
        case 50: return "vlan-apz";
        case 60: return "vlan-lso";
        case 777: return "vlan-mgmt";

        default:
            return "vlan-default";
    }
}

function vlanDisplayClass(port) {

    if (parseInt(port.vlanmode) === 2)
        return "vlan-trunk";

    return vlanClass(port.vlan);
}

function updateConnectionStatus(isOnline) {

    const container = document.getElementById("connection-status");
    const text = document.getElementById("status-text");

    const dot =
        document.getElementById("device-status-dot");

    if (isOnline) {

        text.textContent = "Online";

        if (dot)
            dot.className = "status-dot ok";

        container.className =
            "connection-status ok";

    } else {

        text.textContent = "Offline";

        if (dot)
            dot.className = "status-dot fail";

        container.className =
            "connection-status error";
    }
}


function vlanTooltip(port) {

    if (!port.trunkVlans || !port.trunkVlans.length)
        return "";

    return `
        <div class="tooltip-title">TRUNK PORT</div>
        <div class="tooltip-line">Native VLAN: ${port.vlan || 1}</div>
        <hr>

        ${port.trunkVlans.map(vlan => `
            <div class="tooltip-vlan">
                <span class="tooltip-id">${vlan}</span>
                <span class="tooltip-name">${vlanName(vlan)}</span>
            </div>
        `).join("")}
    `;
}

function updatePowerStatus(itemMap) {

    //console.log("📋 Все доступные items:", Object.keys(itemMap));

    const psu1Item = Object.values(itemMap).find(item =>
        item.name &&
        (
            item.name.includes("PSU1") ||
            item.name.includes("Основное")
        )
    );

    const psu2Item = Object.values(itemMap).find(item =>
        item.name &&
        (
            item.name.includes("PSU2") ||
            item.name.includes("Резервное")
        )
    );

    /*console.log("Найдено по имени:", {
        psu1: psu1Item ? psu1Item.name : null,
        psu2: psu2Item ? psu2Item.name : null
    });*/

    const psu1Dot = document.getElementById("psu1-dot");
    const headerPsu1 =
    document.getElementById("header-psu1");
    const psu2Dot = document.getElementById("psu2-dot");
    const headerPsu2 =
    document.getElementById("header-psu2");
    const devicePsu1Dot = document.getElementById("device-psu1");
    const devicePsu2Dot = document.getElementById("device-psu2");

    // =====================
    // PSU1
    // =====================

    if (psu1Item && psu1Item.lastvalue !== undefined) {

        const val = parseInt(psu1Item.lastvalue);

        if (val === 1) {

            psu1Dot.className = "power-dot ok";
            headerPsu1.className = "power-dot ok";

            if (devicePsu1Dot)
                devicePsu1Dot.className = "power-dot ok";

        } else {

            psu1Dot.className = "power-dot fail";
            headerPsu1.className = "power-dot fail";

            if (devicePsu1Dot)
                devicePsu1Dot.className = "power-dot fail";

        }

    } else {

        psu1Dot.className = "power-dot";
        headerPsu1.className = "power-dot";

        if (devicePsu1Dot)
            devicePsu1Dot.className = "power-dot";

    }

    // =====================
    // PSU2
    // =====================

    if (psu2Item && psu2Item.lastvalue !== undefined) {

        const val = parseInt(psu2Item.lastvalue);

        if (val === 1) {

            psu2Dot.className = "power-dot ok";
            headerPsu2.className = "power-dot ok";

            if (devicePsu2Dot)
                devicePsu2Dot.className = "power-dot ok";

        } else {

            psu2Dot.className = "power-dot fail";
            headerPsu2.className = "power-dot fail";

            if (devicePsu2Dot)
                devicePsu2Dot.className = "power-dot fail";

        }

    } else {

        psu2Dot.className = "power-dot";
        headerPsu2.className = "power-dot";

        if (devicePsu2Dot)
            devicePsu2Dot.className = "power-dot";

    }
}

function updateNeighbors() {

    const container = document.getElementById("neighbors-list");
    if (!container) return;

    container.innerHTML = "";

    for (const n of (window.gxNeighbors || [])) {

        const div = document.createElement("div");
        div.className = "neighbor-item";

        div.innerHTML = `
            <div class="neighbor-local">
                ${n.port}
            </div>

            <div class="neighbor-separator"></div>

            <div class="neighbor-name">
                 ${n.sysName}
            </div>

            <div class="neighbor-ip">
                ${n.ip}
            </div>

            <div class="neighbor-port">
                → ${n.remotePort}
            </div>
        `;

        container.appendChild(div);
    }
}

function getSwitchLayout(model) {

    if (model.includes("2GX-8T")) {
        return {
            fePorts: 8,
            gxPorts: 2
        };
    }

    if (model.includes("3GX-6T")) {
        return {
            fePorts: 6,
            gxPorts: 3
        };
    }

    if (model.includes("4GX-8T")) {
        return {
            fePorts: 8,
            gxPorts: 4
        };
    }

    if (model.includes("3050")) {
        return {
            fePorts: 20,
            gePorts: 4,
            gxPorts: 4
        };
    }

    return {
        fePorts: 0,
        gxPorts: 0
    };
}

function parseLLDPTable(text) {

    const devices = {};
    const lldpMap = {};

    const lines = text.split("\n");

    for (const line of lines) {

        // sysName
        let m = line.match(/1\.1\.9\.(.+?) = STRING: "(.+)"/);

        if (m) {

            const index = m[1];
            const parts = index.split(".");

            devices[index] ??= {};
            devices[index].localPort = parseInt(parts[1]);
            devices[index].sysName = m[2];

            continue;
        }

        // Remote Port
        m = line.match(/1\.1\.8\.(.+?) = STRING: "(.+)"/);

        if (m) {

            const index = m[1];

            devices[index] ??= {};
            devices[index].remotePort = m[2];

            continue;
        }

        // Remote Port ID
        m = line.match(/1\.1\.7\.(.+?) = STRING: "(.+)"/);

        if (m) {

            const index = m[1];

            devices[index] ??= {};
            devices[index].remotePortId = m[2];

            continue;
        }

        // Management IP
        m = line.match(/1\.4\.2\.1\.3\.(.+?)\.1\.4\.((?:\d+\.){3}\d+)/);

        if (m) {

            const index = m[1];

            devices[index] ??= {};
            devices[index].ip = m[2];

            continue;
        }

    }

    for (const d of Object.values(devices)) {

        if (!d.remotePort)
            continue;

        let p = d.remotePort.match(/(\d+)$/);

        if (!p)
            p = d.remotePort.match(/Port[_-](\d+)/i);

        if (!p)
            p = d.remotePortId?.match(/alias:(\d+)/i);

        if (!p)
            p = d.remotePortId?.match(/Port[_-](\d+)/i);

        if (!p)
            p = d.remotePortId?.match(/(\d+)$/);

        d.remotePortNumber = p ? parseInt(p[1]) : null;
    }

    return devices;
}

// =================================================
// Парсер LLDP для старых NetXpert NXI-3030
// Vendor OID:
// 1.3.6.1.4.1.4249.1.201.15.1.1.1.1
// =================================================

function parseLegacyLLDPTable(text) {

    const rows = {};

    if (!text) {
        return {};
    }


    const lines = text.split("\n");


    for (const line of lines) {

        /*
            Ожидаемый конец OID:

            .1.<row> = Local Port
            .3.<row> = Neighbor IP
            .5.<row> = Remote Port
        */

        const match = line.match(
            /\.1\.3\.6\.1\.4\.1\.4249\.1\.201\.15\.1\.1\.1\.1\.(\d+)\.(\d+)\s*=\s*(.+)/
        );


        if (!match) {
            continue;
        }


        const field = parseInt(match[1]);

        const rowIndex = match[2];

        const value = match[3].trim();


        if (!rows[rowIndex]) {

            rows[rowIndex] = {
                localPort: null,
                ip: "",
                remotePort: ""
            };

        }


        // =============================================
        // Field 1 = Local Port
        // =============================================

        if (field === 1) {

            const m = value.match(/INTEGER:\s*(\d+)/i);

            if (m) {

                rows[rowIndex].localPort =
                    parseInt(m[1]);

            }

        }


        // =============================================
        // Field 3 = Neighbor IP
        // =============================================

        else if (field === 3) {

            const m = value.match(
                /Hex-STRING:\s*([0-9A-Fa-f ]+)/
            );


            if (m) {

                const bytes =
                    m[1]
                        .trim()
                        .split(/\s+/)
                        .map(hex =>
                            parseInt(hex, 16)
                        );


                if (bytes.length === 4) {

                    rows[rowIndex].ip =
                        bytes.join(".");

                }

            }

        }


        // =============================================
        // Field 5 = Remote Port
        // =============================================

        else if (field === 5) {

            // Обычная STRING

            let m = value.match(
                /STRING:\s*"(.*)"/i
            );


            if (m) {

                rows[rowIndex].remotePort =
                    m[1];

            }

            else {

                // Старые NXI иногда возвращают:
                //
                // Hex-STRING: 00 08
                //
                // Это означает Port_8

                m = value.match(
                    /Hex-STRING:\s*([0-9A-Fa-f ]+)/
                );


                if (m) {

                    const bytes =
                        m[1]
                            .trim()
                            .split(/\s+/)
                            .map(hex =>
                                parseInt(hex, 16)
                            );


                    if (bytes.length) {

                        const portNumber =
                            bytes[bytes.length - 1];


                        rows[rowIndex].remotePort =
                            `Port_${portNumber}`;

                    }

                }

            }

        }

    }

    console.log(
        "LEGACY LLDP RAW ROWS:",
        rows
    );

    // =================================================
    // Приводим к формату обычного window.neighbors
    // =================================================
    
    

    const neighbors = {};


    for (const [rowIndex, row] of Object.entries(rows)) {

        if (
            row.localPort == null ||
            !row.ip
        ) {

            continue;

        }


        // =================================================
        // Стабильный ключ соседа
        // Лучше всего использовать IP
        // =================================================

        const cacheKey =
            row.ip || `port-${row.localPort}`;


        // =================================================
        // Берём последнее известное значение remotePort
        // =================================================

        const previousNeighbor =
            legacyNeighborCache[cacheKey];


        // Если в новом SNMP-ответе remotePort есть,
        // используем новое значение.
        //
        // Если временно отсутствует,
        // оставляем последнее известное значение.
        // =================================================

        const remotePort =
            row.remotePort ||
            previousNeighbor?.remotePort ||
            "Unknown";


        // =================================================
        // Создаём соседа
        // =================================================

        neighbors[rowIndex] = {

            localPort: row.localPort,

            ip: row.ip,

            remotePort: remotePort,

            sysName:
                getLegacyNeighborName(row.ip)

        };


        // =================================================
        // Сохраняем последнее успешное состояние
        // =================================================

        legacyNeighborCache[cacheKey] = {

            localPort: row.localPort,

            ip: row.ip,

            remotePort: remotePort,

            sysName:
                neighbors[rowIndex].sysName

        };

    }


    console.log(
        "LEGACY LLDP:",
        neighbors
    );


    return neighbors;

}

function findNeighborForPort(portName) {

    if (!window.neighbors)
        return null;

    const portNumber =
        parseInt(portName.match(/\d+$/)?.[0]);

    if (!portNumber)
        return null;

    for (const n of Object.values(window.neighbors)) {

        if (n.localPort === portNumber)
            return n;

    }

    return null;
}

function updateDeviceInfo() {

    const ports = window.allPorts || [];

    document.getElementById("device-fe").innerText =
        ports.filter(p => p.name.startsWith("FE")).length;

    document.getElementById("device-gx").innerText =
        ports.filter(p => p.name.startsWith("GX")).length;

    document.getElementById("device-lldp").innerText =
        window.neighbors ? Object.keys(window.neighbors).length : 0;

    document.getElementById("device-vlan").innerText =
        window.vlanBitmap ? Object.keys(window.vlanBitmap).length : 0;

    document.getElementById("device-up").innerText =
        ports.filter(p => parseInt(p.status) === 1).length;

    document.getElementById("device-down").innerText =
        ports.filter(p => parseInt(p.status) !== 1).length;
}

async function loadPorts() {

    if (loading) {
        //console.log("Предыдущее обновление ещё выполняется...");
        return;
    }

    loading = true;

    try {
        const itemsResult = await zabbixRequest("item.get", {
            hostids: HOST_ID,
            output: ["name", "key_", "lastvalue", "lastclock"],   // lastclock для времени опроса
            search: {
                key_: ["net.if.", "sysUpTime", "vlan.bitmap.table", "PSU", "device.model", "device.firmware", "device.bootrom", "device.hardware", "device.logic", "net.device.name", "lldp.table"]
            },
            searchByAny: true,
            limit: 3000
        });

        const items = itemsResult.result || [];

        // Быстрый мап для поиска
        const itemMap = {};
        for (const item of items) {
            itemMap[item.key_] = item;
        }
        const lldpItem = itemMap["lldp.table"];
        
        // =================================================
        // LLDP DATA
        // =================================================

        if (
            lldpItem &&
            lldpItem.lastvalue !== undefined &&
            lldpItem.lastvalue !== null
        ) {

            try {

                // =============================================
                // Определяем формат LLDP-таблицы
                // =============================================

                const isLegacyLLDP =
                    lldpItem.lastvalue.includes(
                        "1.3.6.1.4.1.4249.1.201.15"
                    );


                let neighbors;


                // =============================================
                // Старая прошивка NetXpert
                // =============================================

                if (isLegacyLLDP) {

                    console.log(
                        "LLDP FORMAT: LEGACY NETXPERT"
                    );

                    neighbors =
                        parseLegacyLLDPTable(
                            lldpItem.lastvalue
                        );

                }


                // =============================================
                // Новая прошивка / стандартный LLDP
                // =============================================

                else {

                    console.log(
                        "LLDP FORMAT: STANDARD"
                    );

                    neighbors =
                        parseLLDPTable(
                            lldpItem.lastvalue
                        );

                }


                // =============================================
                // Сохраняем результат
                // =============================================

                window.neighbors = neighbors;


                // LLDP item получен и успешно обработан

                window.lldpDataValid = true;


                console.log(
                    "NEIGHBORS:",
                    window.neighbors
                );


                updateNeighbors();

            }
            catch (error) {

                // Ошибка разбора LLDP.
                // Старые данные не считаем подтверждёнными.

                window.lldpDataValid = false;

                console.error(
                    "LLDP PARSE ERROR:",
                    error
                );

            }

        }
        else {

            // LLDP item вообще не получен

            window.lldpDataValid = false;

        }

        // =========================
        // DEVICE INFO
        // =========================

        const modelItem =
            itemMap["device.model"];

        const firmwareItem =
            itemMap["device.firmware"];

        const bootromItem =
            itemMap["device.bootrom"];

        const hardwareItem =
            itemMap["device.hardware"];

        const logicItem =
            itemMap["device.logic"];


        DEVICE_MODEL =
            modelItem?.lastvalue || "";
        /*console.log(
            "MODEL:",
            DEVICE_MODEL,
            getSwitchLayout(DEVICE_MODEL)
        );*/
        const hostNameItem = itemMap["net.device.name"];

        const deviceModel = modelItem?.lastvalue ?.replace("NetXpert ", "") || "Unknown model";
        const deviceHost = hostNameItem?.lastvalue || "Unknown host";
        window.currentSwitch = {

            host: deviceHost,

            model: deviceModel,

            ip: HOST_IP

        };

        // console.log("HOST =", deviceHost);
        // console.log("MODEL =", deviceModel);

        //document.getElementById("device-hostname").innerText = deviceHost;
        document.getElementById("header-hostname").innerText = deviceHost;
        //document.getElementById("device-model").innerText = deviceModel;
        document.getElementById("header-model").innerText = deviceModel;
        document.getElementById("device-ip").innerText = HOST_IP;
        updateDeviceVersionRow(
            "device-firmware-row",
            "device-firmware",
            firmwareItem?.lastvalue
        );

        updateDeviceVersionRow(
            "device-bootrom-row",
            "device-bootrom",
            bootromItem?.lastvalue
        );

        updateDeviceVersionRow(
            "device-hardware-row",
            "device-hardware",
            hardwareItem?.lastvalue
        );

        updateDeviceVersionRow(
            "device-logic-row",
            "device-logic",
            logicItem?.lastvalue
        );
        
        
        // =========================
        // VLAN bitmap (обновляется раз в 30 секунд)
        // =========================
        const bitmapItem = itemMap["vlan.bitmap.table"];
        if (bitmapItem && bitmapItem.lastvalue) {
            if (!window.lastVlanUpdate || Date.now() - window.lastVlanUpdate > 30000) {
                
                vlanBitmap = {};
                const lines = bitmapItem.lastvalue.split("\n");
                let count = 0;

                for (const line of lines) {
                    const m = line.match(/\.0\.(\d+)\s+=\s+Hex-STRING:\s+(.+)/);
                    if (m) {
                        vlanBitmap[m[1]] = parseVlanBitmap(m[2].trim());
                        count++;
                    }
                }

                window.lastVlanUpdate = Date.now();
                //console.log(`✅ VLAN bitmap обновлён: ${count} VLAN`);
            }
        }
        window.vlanBitmap = vlanBitmap;
        // =========================
        // Сборка портов
        // =========================
        const ports = {};

        for (const item of items) {
            const match = item.key_.match(/\[(\d+)\]/);
            if (!match) continue;

            const ifindex = match[1];

            if (!ports[ifindex]) {
                ports[ifindex] = {
                    name: ifindex,
                    status: 2,
                    activity: 0,
                    speed: 0,
                    duplex: '',
                    rx: 0,
                    tx: 0,
                    errors: 0,
                    vlan: null,
                    vlanmode: null,
                    trunkVlans: [],
                    ifindex: parseInt(ifindex)
                };
            }

            const port = ports[ifindex];
            const neighborEntry = Object.values(window.neighbors?.devices || {})
                .find(n => n.localPort === port.ifindex % 1000);
            port.neighbor = neighborEntry || null;
            const key = item.key_;
            const value = item.lastvalue;
            //console.log("PORT MATCH:", port.ifindex, neighborEntry);

            if (key.startsWith("net.if.name")) port.name = value;
            else if (key.startsWith("net.if.status")) port.status = value;
            else if (key.startsWith("net.if.activity")) port.activity = value;
            else if (key.startsWith("net.if.speed")) port.speed = value;
            else if (key.startsWith("net.if.duplex")) port.duplex = value;
            else if (key.startsWith("net.if.in[")) port.rx = parseFloat(value) || 0;
            else if (key.startsWith("net.if.out[")) port.tx = parseFloat(value) || 0;
            else if (key.includes(".errors")) port.errors += parseInt(value) || 0;
            else if (key.startsWith("net.if.vlan[")) port.vlan = parseInt(value);
            else if (key.startsWith("net.if.vlanmode[")) port.vlanmode = parseInt(value);
        }

        if (window.neighbors) {

            for (const port of Object.values(ports)) {

                const localPort =
                    normalizePortName(port.name);

                if (localPort == null)
                    continue;

                for (const n of Object.values(window.neighbors)) {

                    if (!n.remotePort)
                        continue;

                    let m =
                        n.remotePort.match(/(\d+)$/);

                    if (!m)
                        continue;

                    const remotePort =
                        parseInt(m[1]);

                    if (remotePort === localPort) {

                        port.neighbor = n;
                        //console.log("MATCH:", port.name, port.neighbor);

                        break;
                    }
                }
            }
        }

        function normalizePortName(name) {

            if (!name) return "";

            // GX-009 -> 9
            let m = name.match(/GX-(\d+)/i);
            if (m) return parseInt(m[1]);

            // FE-001 -> 1
            m = name.match(/FE-(\d+)/i);
            if (m) return parseInt(m[1]);

            // Port_10 -> 10
            m = name.match(/Port[_-](\d+)/i);
            if (m) return parseInt(m[1]);

            return null;
        }


        // Заполняем Trunk VLANs
        const allPorts = Object.values(ports);
        window.allPorts = allPorts;
        for (const port of allPorts) {
            if (parseInt(port.vlanmode) === 2) {
                port.trunkVlans = getTrunkVlansForPort(port.ifindex);
            }
        }

        // Сортировка портов по имени
        allPorts.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

        // =========================
        // UPTIME + LAST SNMP POLL
        // =========================
        const uptimeItem = itemMap["sysUpTime"];

        if (uptimeItem) {
            // Uptime
            const sec = Math.floor(parseInt(uptimeItem.lastvalue || 0) / 100);
            const d = Math.floor(sec / 86400);
            const h = Math.floor((sec % 86400) / 3600);
            const m = Math.floor((sec % 3600) / 60);
            uptimeDiv.innerText = `${d}d ${h}h ${m}m`;
            document.getElementById("device-uptime").innerText =
                `${d}d ${h}h ${m}m`;

            // Время последнего опроса SNMP
            if (uptimeItem.lastclock) {
                updateLastPollTime(parseInt(uptimeItem.lastclock));
            }
        }

        // =========================
        // UPLINKS
        // =========================
        // const gx009 = allPorts.find(p => p.name === "GX-009");
        // const gx010 = allPorts.find(p => p.name === "GX-010");

        const gxPorts = allPorts.filter(
            p => p.name.startsWith("GX")
        );

        //console.log("GX PORTS:", gxPorts);

        

        /*if (gx009) {
            uplink1Speed.innerText = speedToText(gx009.speed);
            uplink1Status.innerText = parseInt(gx009.status) === 1 ? "ACTIVE" : "DOWN";
        }
        if (gx010) {
            uplink2Speed.innerText = speedToText(gx010.speed);
            uplink2Status.innerText = parseInt(gx010.status) === 1 ? "ACTIVE" : "DOWN";
        }*/

        // =========================
        // SUMMARY
        // =========================
        totalCount.innerText = allPorts.length;
        upCount.innerText = allPorts.filter(p => parseInt(p.status) === 1).length;
        downCount.innerText = allPorts.filter(p => parseInt(p.status) !== 1).length;
        errorCount.innerText = allPorts.filter(p => p.errors > 0).length;

        // =========================
        // RENDER PORTS
        // =========================
        
        //console.log("FULL REDRAW");
        portsContainer.innerHTML = "";


        // =================================================
        // Формируем список GX-соседей
        // =================================================

        window.gxNeighbors = [];
        for (const port of allPorts) {
            port.neighbor = null;

            if (window.neighbors) {

                for (const n of Object.values(window.neighbors)) {

                    if (n.localPort === parseInt(port.name.match(/\d+/)?.[0])) {

                        port.neighbor = n;

                        if (port.name.startsWith("GX")) {
                            window.gxNeighbors.push({
                                port: port.name,
                                sysName: n.sysName,
                                ip: n.ip,
                                remotePort: n.remotePort
                            });
                        }

                        break;
                    }
                }
            }

            if (port.name.startsWith("GX")) {

                console.log(
                    "PORT:",
                    port.name,
                    "IFINDEX:",
                    port.ifindex
                );

                console.log(
                    "LLDP:",
                    window.neighbors
                );
            }
            const isUp = parseInt(port.status) === 1;
            const div = document.createElement("div");

            div.className = `
                port
                ${port.name.startsWith("GX") ? "gigabit" : "fast"}
                ${!isUp ? "port-down" : ""}
            `;

            const trunkTitle = port.trunkVlans && port.trunkVlans.length 
                ? port.trunkVlans.map(vlanName).join(', ') 
                : '';

            div.innerHTML = `
                <div class="port-header">
                    <div class="name">${port.name}</div>
                    <div class="speed ${isUp ? linkQuality(port.speed, port.duplex) : 'quality-down'}">
                        ${isUp ? (speedToText(port.speed) + ' ' + duplexToText(port.duplex)) : 'DOWN'}
                    </div>
                </div>

                ${port.neighbor ? `
                    <div class="neighbor-wrap">
                        <div class="neighbor-short">
                            🔗 ${port.neighbor.sysName || port.neighbor || "Unknown"}
                        </div>

                        <div class="neighbor-tooltip">

                            <div class="popup-title">
                                REMOTE DEVICE
                            </div>

                            <div class="popup-separator"></div>

                            <div class="popup-name">
                                ${port.neighbor.sysName}
                            </div>

                            <div class="popup-label">
                                IP Address
                            </div>

                            <div class="popup-value">
                                ${port.neighbor.ip}
                            </div>

                            <div class="popup-label">
                                Remote Port
                            </div>

                            <div class="popup-port">
                                ${port.neighbor.remotePort}
                            </div>

                        </div>
                    </div>
                ` : ""}

                <div class="vlan-wrapper">

                    <div class="vlan ${vlanDisplayClass(port)}">
                        ${vlanDisplay(port)}
                    </div>

                    ${
                        port.trunkVlans && port.trunkVlans.length
                        ? `<div class="vlan-tooltip">${vlanTooltip(port)}</div>`
                        : ''
                    }

                </div>

                <div class="port-body">
                    <div class="rj45"><div class="rj45-inner"></div></div>
                </div>

                <div class="led-row">
                    <div class="led ${statusToClass(port.status, port.errors)}"></div>
                    <div class="led ${parseInt(port.activity) ? 'activity' : 'activity-off'}"></div>
                </div>

                <div class="traffic-row">
                    <span class="rx">↓ ${formatTraffic(port.rx)}</span>
                    <span class="tx">↑ ${formatTraffic(port.tx)}</span>
                </div>

                <div class="${port.errors > 0 ? 'errors-bad' : 'errors-ok'}">
                    ERR ${port.errors}
                </div>
            `;

            portsContainer.appendChild(div);
            updateConnectionStatus(true);
            portsCreated = true;
            updateConnectionStatus(true);
            updatePowerStatus(itemMap);
        }
        window.allPorts = allPorts;
        
    } catch (e) {
        console.error("Ошибка в loadPorts():", e);
        updateConnectionStatus(false);
        updateConnectionStatus(false);
        
    } finally {
        loading = false;
        updateDeviceInfo();
    }
}

function updateLastPollTime(unixTimestamp) {
    const el = document.getElementById("last-update");
    const deviceEl = document.getElementById("device-lastpoll");
    if (!unixTimestamp) {

        el.textContent = "Last SNMP poll: —";

        if (deviceEl)
            deviceEl.textContent = "—";

        el.className = "last-update";

        return;
    }

    const date = new Date(unixTimestamp * 1000);
    const formatted = date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    const ageInSeconds = Math.floor(Date.now() / 1000) - unixTimestamp;
    const ageInMinutes = ageInSeconds / 60;

    let statusClass = "";
    let ageText = "";

    if (ageInMinutes < 5) {
        statusClass = "";
        ageText = "";
    } 
    else if (ageInMinutes < 15) {
        statusClass = "warning";
        ageText = " (УСТАРЕЛИ)";
    } 
    else {
        statusClass = "critical";
        ageText = " (СТАРЫЕ ДАННЫЕ)";
    }

    el.innerHTML = `Last SNMP poll: <b>${formatted}</b>${ageText}`;
    if (deviceEl) {
    deviceEl.innerHTML = `<b>${formatted}</b>${ageText}`;
}
    el.className = `last-update ${statusClass}`;
}


// Вспомогательная функция для красивого отображения трафика
function formatTraffic(bytes) {
    if (!bytes) return "0K";
    if (bytes < 1024) return Math.round(bytes) + "B";
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + "K";
    return (bytes / (1024 * 1024)).toFixed(1) + "M";
}


async function init() {

    const hostResult = await zabbixRequest("host.get", {
        output: ["hostid"],
        selectInterfaces: ["ip"],
        filter: {
            host: [HOST_NAME]
        }
    });

    const hostInfo = hostResult.result?.[0];

    HOST_ID = hostInfo?.hostid;
    HOST_IP = hostInfo?.interfaces?.[0]?.ip || "";

    if (!HOST_ID) {
        throw new Error("Host not found");
    }

      // Загружаем соответствие IP → Zabbix host

    await loadZabbixHostsByIp();
    await loadPorts();
    renderNetworkMap();

    setInterval(loadPorts, 3000); //временно
}

// Запуск
init().catch(console.error);