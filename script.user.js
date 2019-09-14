// ==UserScript==
// @name         Shellshock.io Aimbot
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  try to take over the world!
// @author       Lemons
// @match        *://shellshock.io/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

class Hack {
    static getDistance(p1, p2) {
        var dx = p1.x - p2.x;
        var dy = p1.y - p2.y;
        var dz = p1.z - p2.z;
        return Math.hypot(dx, dy, dz);
    }

    static inView(player) { // closest I could get without having to do any work
        return player.playing &&
            player.actor.mesh.isVisible &&
            player.actor.head.isVisible &&
            player.actor.hands.isVisible &&
            player.actor.bodyMesh.isVisible;
    }

    static handleUpdate(playerList) {
        var players = window.players = playerList.filter(p => !!p);
        var me = window.me = players.find(p => p.ws);

        var targets = players.filter(target => {
            if (target.team && target.team === me.team) return;
            if (!this.inView(target)) return;
            if (target.ws) return;
            return true;
        });

        var nearestTargets = targets.sort((p1, p2) => {
            var d1 = this.getDistance(me, p1);
            var d2 = this.getDistance(me, p2);
            return d1 - d2;
        });

        if (nearestTargets.length > 0) {
            var target = nearestTargets.shift();

            var dx = me.x - target.x;
            var dy = me.y - target.y;
            var dz = me.z - target.z;

            if (this.getDistance(me, target) > window.weapons[me.charClass].range) return;

            var pitch = Math.atan2(dy, Math.hypot(dx, dz)) % Math.PI;
            var yaw = -(Math.atan2(dz, dx) - Math.PI / 2) + (dy > 0 ? Math.PI : -Math.PI);

            me.pitch = pitch;
            me.yaw = yaw;
        }
    }

    static patchHTML(html, game) {
        html = html.replace(/<script src=".*?shellshock\.min\.js.*?"><\/script>/, '<script>' + game + '</script>');
        return html;
    }

    static patchGame(code) {
        code = code.replace(/var stateBufferSize = 256;/, '$& window.weapons = classes.map(c => c.weapon);');
        code = code.replace(/deltaStart = deltaNow;/, '$& Hack.handleUpdate(players);');
        return code;
    }
}

(async function () {
    const htmlRes = await fetch('https://shellshock.io');
    const html = await htmlRes.text();

    const gameURL = html.match(/src="(.*?shellshock\.min\.js.*?)"/)[1];
    const gameRes = await fetch(gameURL);
    const code = await gameRes.text();

    let game = Hack.patchGame(code);
    let page = Hack.patchHTML(html, game);

    window.Hack = Hack;

    document.open();
    document.write(page);
    document.close();
})();
