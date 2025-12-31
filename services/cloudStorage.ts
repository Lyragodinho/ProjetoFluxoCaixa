import { CashFlowState } from '../types.ts';
import { serializeState, deserializeState } from '../utils/stateSerializer.ts';

interface PersistentData {
    appState: CashFlowState;
    config: {
        startDate: string;
    };
}

export const getHashedStateFromUrl = (): string | null => {
    // Utiliza o hash da URL para armazenar o estado comprimido
    const hash = window.location.hash.substring(1);
    return hash || null;
};

const updateUrlHash = (hashedState: string): void => {
    if (window.history.replaceState) {
        // Usa replaceState para evitar adicionar uma entrada no histórico do navegador a cada mudança.
        const newUrl = `${window.location.pathname}${window.location.search}#${hashedState}`;
        window.history.replaceState({ path: newUrl }, '', newUrl);
    } else {
        window.location.hash = hashedState;
    }
};

export const loadStateFromUrl = (hashedState: string): PersistentData | null => {
    if (!hashedState) return null;
    return deserializeState(hashedState);
};

export const saveStateToUrl = (state: CashFlowState, startDate: string): void => {
    const dataToStore: PersistentData = {
        appState: state,
        config: { startDate }
    };
    const hashedState = serializeState(dataToStore);
    if (hashedState) {
        updateUrlHash(hashedState);
    }
};
