import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { AnimatePresence, motion } from "framer-motion"

import { cn } from "@/lib/utils"

// Tabs com controle DOM seguro
const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>((props, ref) => {
  const tabsId = React.useId();
  
  return (
    <TabsPrimitive.Root
      key={`tabs-root-${tabsId}`}
      ref={ref}
      {...props}
    />
  );
});
Tabs.displayName = "Tabs";

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const contentId = React.useId();
  const portalRef = React.useRef<HTMLDivElement | null>(null);
  const [isMounted, setIsMounted] = React.useState(false);
  const [shouldRender, setShouldRender] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    setShouldRender(true);
    
    return () => {
      // Cleanup seguro com timeout para animações
      const timeout = setTimeout(() => {
        if (portalRef.current?.parentNode) {
          try {
            portalRef.current.parentNode.removeChild(portalRef.current);
          } catch (err) {
            console.warn('⚠️ Portal Tabs já removido:', err);
          }
        }
      }, 300); // Tempo da animação exit
      
      return () => clearTimeout(timeout);
    };
  }, []);

  React.useEffect(() => {
    if (!isMounted) {
      const timeout = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [isMounted]);

  if (!isMounted) {
    return null;
  }

  return (
    <div ref={portalRef}>
      <AnimatePresence mode="wait">
        {shouldRender && (
          <TabsPrimitive.Content
            key={`tabs-content-${contentId}`}
            ref={ref}
            className={cn(
              "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              className
            )}
            {...props}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {children}
            </motion.div>
          </TabsPrimitive.Content>
        )}
      </AnimatePresence>
    </div>
  );
})
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
