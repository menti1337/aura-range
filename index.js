module.exports = function AuraRangeNotify(dispatch) {
    const command = dispatch.command;
    const auras = [700230,700231,700232,700233,700330,700630,700631,700730,700731,601,602,603];
    const EffectId = 90520;
    
    let enabled = false,
    partyMembers = [],
    auraMembers = [],
    gameId;

    function gameIdEquals(a, b) {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (typeof a === 'bigint' || typeof b === 'bigint') return BigInt(a) === BigInt(b);
        if (typeof a.equals === 'function') return a.equals(b);
        return String(a) === String(b);
    }

    function gameIdStr(id) {
        return String(id);
    }

    command.add(['aurarange','aura-range', 'aura', 'auras', 'ar'], () => {
        enabled = !enabled;
        command.message('(aura-range) ' + (enabled ? 'enabled' : 'disabled'));
        if (!enabled) removeAllVisuals();
        if (enabled) {
            for (let member of auraMembers) {
                applyVisual({gameId: member});
            }
        }
    });
    
    dispatch.hook('S_LOGIN', 15, (event) => {
        gameId = event.gameId;
        let job = (event.templateId - 10101) % 100;
        enabled = (job === 7) ? true : false;
        partyMembers = [{gameId: gameId}];
        auraMembers = [];
    });
    
    dispatch.hook('S_PARTY_MEMBER_LIST', 9, (event) => {
        partyMembers = event.members;
    });
    
    dispatch.hook('S_LEAVE_PARTY', 1, (event) => {
        removeAllVisuals();
        partyMembers = [{gameId: gameId}];
        let stringId = gameIdStr(gameId);
        if (auraMembers.includes(stringId)) {
            auraMembers = [stringId];
            applyVisual({gameId: gameId});
        } else {
            auraMembers = [];
        }
    });

    dispatch.hook('S_ABNORMALITY_BEGIN', 5, (event) => {
        if (enabled && event.id == EffectId) return false;
        for (let member of partyMembers) {
            if (gameIdEquals(member.gameId, event.target)) {
                if (auras.includes(event.id)) {
                    let stringId = gameIdStr(member.gameId);
                    if (!auraMembers.includes(stringId)) {
                        auraMembers.push(stringId);
                        if (enabled) applyVisual(member);
                    }
                }
                return;
            }
        }
    });

    dispatch.hook('S_ABNORMALITY_REFRESH', 2, (event) => {
        if (enabled && event.id == EffectId) return false;
        for (let member of partyMembers) {
            if (gameIdEquals(member.gameId, event.target)) {
                if (auras.includes(event.id)) {
                    let stringId = gameIdStr(member.gameId);
                    if (!auraMembers.includes(stringId)) {
                        auraMembers.push(stringId);
                        if (enabled) applyVisual(member);
                    }
                }
                return;
            }
        }
    });

    dispatch.hook('S_ABNORMALITY_END', 1, (event) => {
        if (enabled && event.id == EffectId) return false;
        for (let member of partyMembers) {
            if (gameIdEquals(member.gameId, event.target)) {
                if (auras.includes(event.id)) {
                    let stringId = gameIdStr(member.gameId);
                    if (auraMembers.includes(stringId)) {
                        auraMembers.splice(auraMembers.indexOf(stringId), 1);
                        if (enabled) removeVisual(member);
                    }
                }
                return;
            }
        }
    });
    
    function applyVisual(member) {
        dispatch.toClient('S_ABNORMALITY_END', 1, {
            target: member.gameId,
            id: EffectId
        });
        dispatch.toClient('S_ABNORMALITY_BEGIN', 5, {
            target: member.gameId,
            source: gameId,
            id: EffectId,
            duration: 0,
            unk: 0,
            stacks: 1,
            unk2: 0
        });
    }
    
    function removeVisual(member) {
        dispatch.toClient('S_ABNORMALITY_END', 1, {
            target: member.gameId,
            id: EffectId
        });
    }
    
    function removeAllVisuals() {
        for (let i = 0; i < partyMembers.length; i++) {
            removeVisual(partyMembers[i]);
        }
    }
}
