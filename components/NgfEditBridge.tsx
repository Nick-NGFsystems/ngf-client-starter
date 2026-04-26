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
      /* Pulse highlight when editor scrolls to a field */
      [data-ngf-field].ngf-field-focus {
        animation: ngfFieldFocus 1.6s ease-out;
      }
      @keyframes ngfFieldFocus {
        0%   { outline-color: #3b82f6 !important; background-color: rgba(59,130,246,0.25) !important; }
        100% { outline-color: rgba(59,130,246,0.45) !important; background-color: transparent !important; }
      }

      /* Dropdown toggle hint — make it obvious dropdown triggers still work
         in edit mode (they do; the click handler below lets them through). */
      [data-ngf-edit="true"] [aria-haspopup],
      [data-ngf-edit="true"] [aria-expanded] {
        cursor: pointer !important;
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
      #ngf-nav-popup .ngf-edit-btn {
        color: #0f172a;
        background: transparent;
      }
      #ngf-nav-popup .ngf-edit-btn:hover {
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

    type EditTarget = {
      section: string
      field: string
      value: string
      rect: DOMRect
    }

    function postFieldClick(t: EditTarget) {
      window.parent.postMessage(
        {
          type:    'fieldClick',
          section: t.section,
          field:   t.field,
          currentValue: t.value,
          elementRect: {
            top:    t.rect.top,
            left:   t.rect.left,
            bottom: t.rect.bottom,
            right:  t.rect.right,
            width:  t.rect.width,
            height: t.rect.height,
          },
        },
        '*',
      )
    }

    function showNavPopup(
      href: string,
      label: string,
      clientX: number,
      clientY: number,
      editTarget?: EditTarget,
    ) {
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

      if (editTarget) {
        const editBtn = document.createElement('button')
        editBtn.className = 'ngf-nav-btn ngf-edit-btn'
        editBtn.textContent = '✎  Edit'
        editBtn.addEventListener('click', (ev) => {
          ev.stopPropagation()
          dismissNavPopup()
          postFieldClick(editTarget)
        })
        popup.appendChild(editBtn)
      }

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

    // ── Default-value cache ───────────────────────────────────────────────────
    // Capture each annotated field's original server-rendered value on first
    // sight. For <img> or data-ngf-type="image" we cache the src; everything
    // else caches textContent. Stored on the element itself so it survives
    // later DOM mutations and so the editor can send '' to mean "restore".
    function isImageField(el: HTMLElement) {
      return el.tagName?.toLowerCase() === 'img' || el.getAttribute('data-ngf-type') === 'image'
    }
    function captureDefaults() {
      document.querySelectorAll<HTMLElement>('[data-ngf-field]').forEach(el => {
        if (el.dataset.ngfDefault === undefined) {
          el.dataset.ngfDefault = isImageField(el)
            ? (el as HTMLImageElement).getAttribute('src') ?? ''
            : el.textContent ?? ''
        }
      })
    }
    captureDefaults()

    window.parent.postMessage({ type: 'ngfReady' }, '*')

    const messageHandler = (e: MessageEvent) => {
      if (e.data?.type === 'setEditMode') {
        editMode = !!e.data.enabled
        document.documentElement.setAttribute('data-ngf-edit', editMode ? 'true' : 'false')
        // Re-run in case fields were hydrated after initial capture
        captureDefaults()
        if (!editMode) dismissNavPopup()
      }

      if (e.data?.type === 'contentUpdate' && e.data.content) {
        const walk = (obj: unknown, path: string) => {
          if (obj === null || obj === undefined) return
          if (typeof obj === 'string') {
            const el = document.querySelector<HTMLElement>(`[data-ngf-field="${path}"]`)
            if (el) {
              // Empty string = restore the original SSR value (the hardcoded
              // fallback for an unpopulated field). For <img>/image fields we
              // swap `src`; for everything else we swap textContent.
              const next = obj === '' ? (el.dataset.ngfDefault ?? '') : obj
              if (isImageField(el)) {
                el.setAttribute('src', next)
              } else {
                el.textContent = next
              }
            }
            return
          }
          if (Array.isArray(obj)) {
            obj.forEach((item, i) => walk(item, `${path}.${i}`))
            return
          }
          if (typeof obj === 'object') {
            for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
              walk(v, path ? `${path}.${k}` : k)
            }
          }
        }
        walk(e.data.content, '')
      }

      // Editor asks us to scroll the iframe to a specific field + flash it
      if (e.data?.type === 'scrollToField' && typeof e.data.path === 'string') {
        const el = document.querySelector<HTMLElement>(`[data-ngf-field="${e.data.path}"]`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          el.classList.remove('ngf-field-focus')
          // Restart animation
          void el.offsetWidth
          el.classList.add('ngf-field-focus')
          setTimeout(() => el.classList.remove('ngf-field-focus'), 1700)
        }
      }

      // Editor asks us to append a new card to a repeatable group. We clone
      // the existing last child (the template), re-index every data-ngf-field
      // descendant to the new index, clear textContent so placeholders show,
      // and append. After the user fills and publishes, SSR re-renders the
      // card naturally on next reload.
      if (e.data?.type === 'addGroupItem' && typeof e.data.group === 'string' && typeof e.data.newIndex === 'number') {
        const group = document.querySelector<HTMLElement>(`[data-ngf-group="${e.data.group}"]`)
        if (!group) return
        const children = Array.from(group.children) as HTMLElement[]
        const template = children[children.length - 1]
        if (!template) return

        const clone = template.cloneNode(true) as HTMLElement
        const prefix = `${e.data.group}.`
        // Re-index every [data-ngf-field] inside the clone to newIndex.
        // For text fields: blank textContent so :empty::before placeholder shows.
        // For image fields: keep a neutral grey placeholder data-URI so the user
        // sees "something to click" until they edit the image field.
        const imgPlaceholder =
          'data:image/svg+xml;utf8,' + encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
            '<rect width="400" height="300" fill="#e2e8f0"/>' +
            '<text x="200" y="155" text-anchor="middle" font-family="sans-serif" ' +
            'font-size="16" fill="#94a3b8">Click to set image</text></svg>'
          )
        clone.querySelectorAll<HTMLElement>('[data-ngf-field]').forEach(child => {
          const path = child.getAttribute('data-ngf-field') || ''
          if (path.startsWith(prefix)) {
            const rest = path.slice(prefix.length)       // e.g. "3.name"
            const dot  = rest.indexOf('.')
            if (dot > -1) {
              const subField = rest.slice(dot + 1)       // "name"
              const newPath  = `${prefix}${e.data.newIndex}.${subField}`
              child.setAttribute('data-ngf-field', newPath)
              // Reset default cache and current value for the new slot.
              if (isImageField(child)) {
                child.dataset.ngfDefault = imgPlaceholder
                child.setAttribute('src', imgPlaceholder)
              } else {
                child.dataset.ngfDefault = ''
                child.textContent = ''
              }
            }
          }
        })
        group.appendChild(clone)
        clone.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }

      // Editor asks us to reorder two cards within a group. Swap the DOM
      // positions of the items and rewrite every descendant data-ngf-field
      // index on both cards (and everything between them) so they stay in
      // sync with the editor's content array order.
      if (e.data?.type === 'moveGroupItem' && typeof e.data.group === 'string' && typeof e.data.from === 'number' && typeof e.data.to === 'number') {
        const group = document.querySelector<HTMLElement>(`[data-ngf-group="${e.data.group}"]`)
        if (!group) return
        const prefix = `${e.data.group}.`
        const children = Array.from(group.children) as HTMLElement[]
        const from = e.data.from
        const to   = e.data.to
        if (from < 0 || from >= children.length || to < 0 || to >= children.length) return

        // Reorder the DOM
        const moved = children[from]
        if (to > from) {
          // insert after children[to]
          group.insertBefore(moved, children[to].nextSibling)
        } else {
          // insert before children[to]
          group.insertBefore(moved, children[to])
        }

        // Re-index every card's data-ngf-field to match its new position.
        const reordered = Array.from(group.children) as HTMLElement[]
        reordered.forEach((card, newIdx) => {
          card.querySelectorAll<HTMLElement>('[data-ngf-field]').forEach(child => {
            const path = child.getAttribute('data-ngf-field') || ''
            if (path.startsWith(prefix)) {
              const rest = path.slice(prefix.length)
              const dot  = rest.indexOf('.')
              if (dot > -1) {
                const subField = rest.slice(dot + 1)
                child.setAttribute('data-ngf-field', `${prefix}${newIdx}.${subField}`)
              }
            }
          })
        })
      }

      // Editor asks us to remove a card and re-index subsequent siblings.
      if (e.data?.type === 'removeGroupItem' && typeof e.data.group === 'string' && typeof e.data.index === 'number') {
        const group = document.querySelector<HTMLElement>(`[data-ngf-group="${e.data.group}"]`)
        if (!group) return
        const prefix = `${e.data.group}.`
        const removeIdx = e.data.index
        const children = Array.from(group.children) as HTMLElement[]

        // Find and remove the child whose descendants are indexed at removeIdx
        const target = children.find(child =>
          child.querySelector(`[data-ngf-field^="${prefix}${removeIdx}."]`)
        )
        if (target) target.remove()

        // Shift indices for all remaining children whose index > removeIdx
        const remaining = Array.from(group.children) as HTMLElement[]
        remaining.forEach(card => {
          card.querySelectorAll<HTMLElement>('[data-ngf-field]').forEach(child => {
            const path = child.getAttribute('data-ngf-field') || ''
            if (path.startsWith(prefix)) {
              const rest = path.slice(prefix.length)
              const dot  = rest.indexOf('.')
              if (dot > -1) {
                const idxStr = rest.slice(0, dot)
                const idx    = parseInt(idxStr, 10)
                if (!isNaN(idx) && idx > removeIdx) {
                  const subField = rest.slice(dot + 1)
                  const newPath  = `${prefix}${idx - 1}.${subField}`
                  child.setAttribute('data-ngf-field', newPath)
                }
              }
            }
          })
        })
      }
    }

    // ── Click handler ─────────────────────────────────────────────────────────
    const clickHandler = (e: MouseEvent) => {
      if (!editMode) return
      if (navPopup && navPopup.contains(e.target as Node)) return
      if (navPopup) dismissNavPopup()

      // Single upward walk finds the nearest anchor AND nearest field.
      let cursor: HTMLElement | null = e.target as HTMLElement | null
      let anchor: HTMLAnchorElement | null = null
      let fieldEl: HTMLElement | null = null
      let buttonEl: HTMLButtonElement | null = null
      let toggleEl: HTMLElement | null = null
      while (cursor && cursor !== document.documentElement) {
        const tag = cursor.tagName?.toLowerCase()
        if (!anchor   && tag === 'a')                                anchor   = cursor as HTMLAnchorElement
        if (!buttonEl && tag === 'button')                           buttonEl = cursor as HTMLButtonElement
        if (!fieldEl  && cursor.getAttribute?.('data-ngf-field'))    fieldEl  = cursor
        // A dropdown/disclosure toggle — has aria-haspopup or aria-expanded.
        if (!toggleEl && cursor.hasAttribute?.('aria-haspopup'))     toggleEl = cursor
        if (!toggleEl && cursor.hasAttribute?.('aria-expanded'))     toggleEl = cursor
        cursor = cursor.parentElement
      }

      // If the click is on a dropdown toggle AND the toggle itself is NOT the
      // editable field, let the site's own React/JS handle it (open/close the
      // menu). The user can click items inside the open menu to edit them.
      // This keeps dropdowns expandable, not always-expanded.
      if (toggleEl && toggleEl !== fieldEl) {
        // Don't preventDefault — let the site's onClick fire.
        return
      }

      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()

      // Build an EditTarget from the field element, if any
      let editTarget: EditTarget | undefined
      if (fieldEl) {
        const attr = fieldEl.getAttribute('data-ngf-field') ?? ''
        const dot = attr.indexOf('.')
        if (dot > -1) {
          const isImg = isImageField(fieldEl)
          editTarget = {
            section: attr.substring(0, dot),
            field:   attr.substring(dot + 1),
            value:   isImg
              ? (fieldEl.getAttribute('src') ?? '')
              : (fieldEl.textContent?.trim() ?? ''),
            rect:    fieldEl.getBoundingClientRect(),
          }
        }
      }

      // Precedence:
      //   1. Anchor (internal hash) → scroll, no popup (even if editable — feels disorienting)
      //   2. Anchor (real href) → popup with Go to page + Edit (if editable)
      //   3. Editable field outside any link → fire fieldClick directly
      //   4. Button (no link, no field) → silently block (e.g. mobile menu toggle)

      if (anchor) {
        const href = anchor.getAttribute('href') ?? ''
        if (href.startsWith('#')) {
          const id = href.slice(1)
          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
          return
        }
        if (href && href !== '#') {
          const label = anchor.textContent?.trim() || anchor.getAttribute('aria-label') || 'Link'
          showNavPopup(anchor.href, label, e.clientX, e.clientY, editTarget)
          return
        }
        // Anchor with no href — treat as plain editable (if any)
      }

      if (editTarget) {
        postFieldClick(editTarget)
        return
      }

      // Button click with nothing editable — just block
      if (buttonEl) return
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
