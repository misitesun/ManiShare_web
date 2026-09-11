import { useState } from 'react'
import type { ReactElement } from 'react'
import { TldMembershipBadge } from '../../../shared/ui/tld-membership-badge'
import { communityMessages } from '../model/home-data'
import type { HomeCommunityMessage } from '../model/home-data'
import { AutoMarquee } from './AutoMarquee'

function rotateMessages(
    messages: readonly HomeCommunityMessage[],
    start: number,
): readonly HomeCommunityMessage[] {
    return [...messages.slice(start), ...messages.slice(0, start)]
}

function createMessageRows(): readonly (readonly HomeCommunityMessage[])[] {
    const firstOffset = Math.floor(Math.random() * communityMessages.length)
    const secondOffset = (firstOffset + 2) % communityMessages.length
    const thirdOffset = (firstOffset + 4) % communityMessages.length

    return [
        rotateMessages(communityMessages, firstOffset),
        rotateMessages(communityMessages, secondOffset),
        rotateMessages(communityMessages, thirdOffset),
    ]
}

interface MessageChipProps {
    readonly message: HomeCommunityMessage
}

function MessageChip({ message }: MessageChipProps): ReactElement {
    return (
        <span className="flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full border border-strong bg-surface-raised px-2 text-xs text-secondary">
            {message.membershipLabel === undefined ||
            message.membershipTone === undefined ? null : (
                <TldMembershipBadge
                    label={message.membershipLabel}
                    size="compact"
                    tone={message.membershipTone}
                />
            )}
            {message.avatarSource === undefined ? null : (
                <img
                    alt=""
                    aria-hidden="true"
                    className="size-5 rounded-full object-cover"
                    src={message.avatarSource}
                />
            )}
            <span className="text-primary">{message.name}</span>
            <span>{message.message}</span>
            <span className="text-muted">Day{message.day}</span>
        </span>
    )
}

export function CommunityMessages(): ReactElement {
    const [messageRows] = useState<readonly (readonly HomeCommunityMessage[])[]>(createMessageRows)

    return (
        <section
            aria-label="学习留言"
            className="flex h-[135px] flex-col justify-center gap-2 overflow-hidden rounded-xl border border-strong bg-canvas py-2"
        >
            {messageRows.map((messages, rowIndex) => (
                <AutoMarquee key={rowIndex} durationSeconds={32 + rowIndex * 6}>
                    {messages.map((message) => (
                        <MessageChip key={`${message.name}-${message.day}`} message={message} />
                    ))}
                </AutoMarquee>
            ))}
        </section>
    )
}
