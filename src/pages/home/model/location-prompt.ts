import { sharedConfig } from '../../../shared/config'
import { storage } from '../../../shared/lib/storage'
import { shouldShowLocationPrompt } from './location-prompt-state'

export function hasConfirmedLocationPrompt(): boolean {
    return !shouldShowLocationPrompt(storage.get(sharedConfig.storageKeys.locationPromptConfirmed))
}

export function confirmLocationPrompt(): void {
    storage.set(sharedConfig.storageKeys.locationPromptConfirmed, true)
}
