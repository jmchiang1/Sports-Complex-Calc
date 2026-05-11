"use client"

import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible"

function Collapsible({ ...props }: CollapsiblePrimitive.Root.Props) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

function CollapsibleTrigger({ ...props }: CollapsiblePrimitive.Trigger.Props) {
  return (
    <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} />
  )
}

function CollapsibleContent({ ...props }: CollapsiblePrimitive.Panel.Props) {
  // keepMounted=true so the closing animation can play before the panel
  // is removed from the DOM (otherwise base-ui unmounts on close and the
  // animation never gets to render).
  return (
    <CollapsiblePrimitive.Panel
      data-slot="collapsible-content"
      keepMounted
      {...props}
    />
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
