import {
    cloneElement,
    isValidElement,
    useCallback,
    useContext,
    useEffect,
    useId,
    useRef,
    useState,
} from 'react'
import type { CSSProperties, FocusEvent, ReactElement, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { TooltipGroupContext, type TooltipGroupContextValue } from './context'
import { getTooltipCoordinates } from './position'
import type { TooltipCoordinates, TooltipPlacement } from './position'

interface TooltipChildProps {
    readonly 'aria-describedby'?: string
}

export interface TooltipProps {
    readonly children: ReactElement
    readonly content: ReactNode
    readonly fullWidth?: boolean
    readonly height?: CSSProperties['height']
    readonly offset?: number
    readonly placement?: TooltipPlacement
}

export function Tooltip({
    children,
    content,
    fullWidth = false,
    height = '2.25rem',
    offset = 8,
    placement = 'right',
}: TooltipProps): ReactElement {
    const group = useContext(TooltipGroupContext)
    const props = { children, content, fullWidth, height, offset, placement }
    return group === null ? (
        <StandaloneTooltip {...props} />
    ) : (
        <GroupedTooltip {...props} group={group} />
    )
}

interface GroupedTooltipProps extends TooltipProps {
    readonly group: TooltipGroupContextValue
}

function GroupedTooltip({
    children,
    content,
    fullWidth = false,
    group,
    height = '2.25rem',
    offset = 8,
    placement = 'right',
}: GroupedTooltipProps): ReactElement {
    const tooltipId = useId()
    const triggerRef = useRef<HTMLElement | null>(null)
    const groupHide = group.hide
    const groupShow = group.show
    const isActive = group.activeId === tooltipId

    const setTriggerNode = useCallback((node: HTMLElement | null): void => {
        triggerRef.current = node
    }, [])

    const showTooltip = useCallback((): void => {
        const trigger = triggerRef.current
        if (trigger === null) return
        groupShow({ content, height, id: tooltipId, offset, placement, trigger })
    }, [content, groupShow, height, offset, placement, tooltipId])

    const hideTooltip = useCallback((): void => {
        groupHide(tooltipId)
    }, [groupHide, tooltipId])

    const hideTooltipAfterFocusLeaves = useCallback(
        (event: FocusEvent<HTMLElement>): void => {
            if (
                event.relatedTarget instanceof Node &&
                event.currentTarget.contains(event.relatedTarget)
            ) {
                return
            }
            hideTooltip()
        },
        [hideTooltip],
    )

    useEffect(
        () => (): void => {
            groupHide(tooltipId, true)
        },
        [groupHide, tooltipId],
    )

    const describedChild =
        isActive && isValidElement<TooltipChildProps>(children)
            ? cloneElement(children, {
                  'aria-describedby':
                      children.props['aria-describedby'] === undefined
                          ? group.tooltipId
                          : `${children.props['aria-describedby']} ${group.tooltipId}`,
              })
            : children

    return fullWidth ? (
        <div
            ref={setTriggerNode}
            className="block w-full"
            onBlurCapture={hideTooltipAfterFocusLeaves}
            onFocusCapture={showTooltip}
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
        >
            {describedChild}
        </div>
    ) : (
        <span
            ref={setTriggerNode}
            className="inline-flex"
            onBlurCapture={hideTooltipAfterFocusLeaves}
            onFocusCapture={showTooltip}
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
        >
            {describedChild}
        </span>
    )
}

function StandaloneTooltip({
    children,
    content,
    fullWidth = false,
    height = '2.25rem',
    offset = 8,
    placement = 'right',
}: TooltipProps): ReactElement {
    const tooltipId = useId()
    const triggerRef = useRef<HTMLElement | null>(null)
    const [coordinates, setCoordinates] = useState<TooltipCoordinates | null>(null)
    const [isVisible, setIsVisible] = useState(false)

    const setTriggerNode = useCallback((node: HTMLElement | null): void => {
        triggerRef.current = node
    }, [])

    const updatePosition = useCallback((): void => {
        const trigger = triggerRef.current
        if (trigger === null) return
        setCoordinates(getTooltipCoordinates(trigger.getBoundingClientRect(), placement, offset))
    }, [offset, placement])

    const showTooltip = useCallback((): void => {
        updatePosition()
        setIsVisible(true)
    }, [updatePosition])

    const hideTooltip = useCallback((): void => {
        setIsVisible(false)
    }, [])

    const hideTooltipAfterFocusLeaves = useCallback(
        (event: FocusEvent<HTMLElement>): void => {
            if (
                event.relatedTarget instanceof Node &&
                event.currentTarget.contains(event.relatedTarget)
            )
                return
            hideTooltip()
        },
        [hideTooltip],
    )

    useEffect(() => {
        if (!isVisible) return undefined
        window.addEventListener('resize', updatePosition)
        window.addEventListener('scroll', updatePosition, true)
        return (): void => {
            window.removeEventListener('resize', updatePosition)
            window.removeEventListener('scroll', updatePosition, true)
        }
    }, [isVisible, updatePosition])

    const describedChild = isValidElement<TooltipChildProps>(children)
        ? cloneElement(children, {
              'aria-describedby':
                  children.props['aria-describedby'] === undefined
                      ? tooltipId
                      : `${children.props['aria-describedby']} ${tooltipId}`,
          })
        : children
    const trigger = fullWidth ? (
        <div
            ref={setTriggerNode}
            className="block w-full"
            onBlurCapture={hideTooltipAfterFocusLeaves}
            onFocusCapture={showTooltip}
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
        >
            {describedChild}
        </div>
    ) : (
        <span
            ref={setTriggerNode}
            className="inline-flex"
            onBlurCapture={hideTooltipAfterFocusLeaves}
            onFocusCapture={showTooltip}
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
        >
            {describedChild}
        </span>
    )

    const tooltip =
        !isVisible || coordinates === null || typeof document === 'undefined'
            ? null
            : createPortal(
                  <span
                      id={tooltipId}
                      role="tooltip"
                      className={
                          placement === 'top'
                              ? 'pointer-events-none fixed z-50 flex -translate-x-1/2 -translate-y-full items-center whitespace-nowrap rounded-md bg-tooltip px-3 text-sm font-normal text-tooltip-text shadow-panel'
                              : placement === 'right'
                                ? 'pointer-events-none fixed z-50 flex -translate-y-1/2 items-center whitespace-nowrap rounded-md bg-tooltip px-3 text-sm font-normal text-tooltip-text shadow-panel'
                                : placement === 'bottom'
                                  ? 'pointer-events-none fixed z-50 flex -translate-x-1/2 items-center whitespace-nowrap rounded-md bg-tooltip px-3 text-sm font-normal text-tooltip-text shadow-panel'
                                  : 'pointer-events-none fixed z-50 flex -translate-x-full -translate-y-1/2 items-center whitespace-nowrap rounded-md bg-tooltip px-3 text-sm font-normal text-tooltip-text shadow-panel'
                      }
                      style={{ height, left: coordinates.left, top: coordinates.top }}
                  >
                      {content}
                      <span
                          aria-hidden="true"
                          className={
                              placement === 'top'
                                  ? 'absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[6px] border-t-[6px] border-x-transparent border-t-tooltip'
                                  : placement === 'right'
                                    ? 'absolute right-full top-1/2 h-0 w-0 -translate-y-1/2 border-y-[6px] border-r-[6px] border-y-transparent border-r-tooltip'
                                    : placement === 'bottom'
                                      ? 'absolute bottom-full left-1/2 h-0 w-0 -translate-x-1/2 border-x-[6px] border-b-[6px] border-x-transparent border-b-tooltip'
                                      : 'absolute left-full top-1/2 h-0 w-0 -translate-y-1/2 border-y-[6px] border-l-[6px] border-y-transparent border-l-tooltip'
                          }
                      />
                  </span>,
                  document.body,
              )

    return (
        <>
            {trigger}
            {tooltip}
        </>
    )
}
