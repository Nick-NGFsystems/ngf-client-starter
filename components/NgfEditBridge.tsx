'use client'
import { useEffect } from 'react'

/**
 * NgfEditBridge — enables the NGF portal's live preview and click-to-edit.
 * Must be included in app/layout.tsx. Do not remove.
 */
export default function NgfEditBridge() {
  useEffect(() => {
    let editMode = false

    const style = document.createElement('style')
    style.id = 'ngf-edit-styles'
    style.textContent = `
      [data-ngf-edit="true"] [data-ngf-field] {
        outline: 1.5px dashed rgba(59,130,246,0.45) !important;
        border-radius: 3px;
        cursor: pointer !important;
      }
      [data-ngf-edit="true"] [data-ngf-field]:hover {
        outline-color: #3b82f6 !important;
        background-color: rgba(59,130,246,0.06) !important;
      }
      /* Empty field placeholder — keeps blank fields clickable in edit mode */
      [data-ngf-edit="true"] [data-ngf-field]:empty {
        min-height: 1.2em;
        min-width: 60px;
        display: inline-block;
      }
      [data-ngf-edit="true"] [data-ngf-field]:empty::before {
        content: attr(data-ngf-label);
        color: #94a3b8;
        font-style: italic;
        pointer-events: none;
      }

      /* Navigation popup injected by NgfEditBridge */
      #ngf-nav-popup {
        position: fixed;
        z-index: 2147483647;
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        box-shadow: 0 4px 24px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.08);
        padding: 6px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 170px;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        pointer-events: auto !important;
      }
      #ngf-nav-popup-label {
        font-size: 11px;
        color: #94a3b8;
        padding: 4px 10px 2px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 200px;
      }
      #ngf-nav-popup .ngf-nav-btn {
        all: unset;
        display: block;
        width: 100%;
        box-sizing: border-box;
        padding: 7px 10px;
        border-radius: 7px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.12s;
        white-space: nowrap;
        pointer-events: auto !important;
      }
      #ngf-nav-popup .ngf-go-btn {
        color: #1d4ed8;
        background: #eff6ff;
      }
      #ngf-nav-popup .ngf-go-btn:hover {
        background: #dbeafe;
      }
      #ngf-nav-popup .ngf-stay-btn {
        color: #6b7280;
        background: transparent;
      }
      #ngf-nav-popup .ngf-stay-btn:hover {
        background: #f3f4f6;
      }
    `
    document.head.appendChild(style)

    // ── Nav popup helpers ──────────────────────────────────────────────────────
    let navPopup: HTMLDivElement | null = null

    function dismissNavPopup() {
      navPopup?.remove()
      navPopup = null
    }

    function showNavPopup(href: string, label: string, clientX: number, clientY: number) {
      dismissNavPopup()

      const popup = document.createElement('div')
      popup.id = 'ngf-nav-popup'

      const lbl = document.createElement('div')
      lbl.id = 'ngf-nav-popup-label'
      lbl.textContent = label || 'Link'
      popup.appendChild(lbl)

      const goBtn = document.createElement('button')
      goBtn.className = 'ngf-nav-btn ngf-go-btn'
      goBtn.textContent = '→  Go to page'
      goBtn.addEventListener('click', (ev) => {
        ev.stopPropagation()
        dismissNavPopup()
        window.location.href = href
      })
      popup.appendChild(goBtn)

      const stayBtn = document.createElement('button')
      stayBtn.className = 'ngf-nav-btn ngf-stay-btn'
      stayBtn.textContent = 'Stay on page'
      stayBtn.addEventListener('click', (ev) => {
        ev.stopPropagation()
        dismissNavPopup()
      })
      popup.appendChild(stayBtn)

      popup.style.visibility = 'hidden'
      document.body.appendChild(popup)
      navPopup = popup

      const pw = popup.offsetWidth || 180
      const ph = popup.offsetHeight || 110
      const vw = window.innerWidth
      const vh = window.innerHeight
      let left = clientX
      let top = clientY + 10
      if (left + pw + 8 > vw) left = vw - pw - 8
      if (top + ph + 8 > vh) top = clientY - ph - 10
      popup.style.left = `${Math.max(8, left)}px`
      popup.style.top = `${Math.max(8, top)}px`
      popup.style.visibility = ''
    }

    window.parent.postMessage({ type: 'ngfReady' }, '*')

    const messageHandler = (e: MessageEvent) => {
      if (e.data?.type === 'setEditMode') {
        editMode = !!e.data.enabled
        document.documentElement.setAttribute('data-ngf-edit', editMode ? 'true' : 'false')
        if (!editMode) dismissNavPopup()
      }

      if (e.data?.type === 'contentUpdate' && e.data.content) {
        function applyFlat(obj: Record<string, unknown>, prefix: string) {
          for (const [key, value] of Object.entries(obj)) {
            const path = prefix ? `${prefix}.${key}` : key
            if (typeof value === 'string') {
              const el = document.querySelector<HTMLElement>(`[data-ngf-field="${path}"]`)
              if (el) el.textContent = value
            } else if (Array.isArray(value)) {
              value.forEach((item, i) => {
                if (item && typeof item === 'object') {
                  applyFlat(item as Record<string, unknown>, `${path}.${i}`)
                }
              })
            } else if (value && typeof value === 'object') {
              applyFlat(value as Record<string, unknown>, path)
            }
          }
        }
        applyFlat(e.data.content as Record<string, unknown>, '')
      }
    }

    // Capture phase — intercepts before any link/button default handlers
    const clickHandler = (e: MouseEvent) => {
      if (!editMode) return

      // Let clicks inside the nav popup through — the popup manages itself
      if (navPopup && navPopup.contains(e.target as Node)) return

      // Dismiss popup when clicking anywhere else
      if (navPopup) dismissNavPopup()

      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()

      // Walk up DOM looking for data-ngf-field first
      let target = e.target as HTMLElement | null
      while (target && target !== document.documentElement) {
        const attr = target.getAttribute('data-ngf-field')
        if (attr) {
          const dot = attr.indexOf('.')
          if (dot > -1) {
            const rect = target.getBoundingClientRect()
            window.parent.postMessage(
              {
                type: 'fieldClick',
                section: attr.substring(0, dot),
                field: attr.substring(dot + 1),
                currentValue: target.textContent?.trim() ?? '',
                elementRect: {
                  top: rect.top, left: rect.left,
                  bottom: rect.bottom, right: rect.right,
                  width: rect.width, height: rect.height,
                },
              },
              '*'
            )
          }
          return
        }
        target = target.parentElement
      }

      // No editable field — check if a navigable link was clicked
      target = e.target as HTMLElement | null
      while (target && target !== document.documentElement) {
        const tag = target.tagName?.toLowerCase()

        if (tag === 'a') {
          const anchor = target as HTMLAnchorElement
          const href = anchor.getAttribute('href') ?? ''

          if (href.startsWith('#')) {
            // In-page anchor — scroll directly without popup
            const id = href.slice(1)
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
          } else if (href && href !== '#') {
            const label = anchor.textContent?.trim() || anchor.getAttribute('aria-label') || 'Link'
            showNavPopup(anchor.href, label, e.clientX, e.clientY)
          }
          return
        }

        if (tag === 'button') {
          // Non-field button — silently block (e.g. mobile menu toggle)
          return
        }

        target = target.parentElement
      }
    }

    window.addEventListener('message', messageHandler)
    document.addEventListener('click', clickHandler, true)

    return () => {
      window.removeEventListener('message', messageHandler)
      document.removeEventListener('click', clickHandler, true)
      document.getElementById('ngf-edit-styles')?.remove()
      document.documentElement.removeAttribute('data-ngf-edit')
      dismissNavPopup()
    }
  }, [])

  return null
}
