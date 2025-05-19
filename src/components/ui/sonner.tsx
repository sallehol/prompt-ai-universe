
// import { useTheme } from "next-themes" // Removed next-themes as it's not standard in Vite/React unless specifically added
import { Toaster as SonnerPrimitive, toast } from "sonner" // Renamed import to SonnerPrimitive

type ToasterProps = React.ComponentProps<typeof SonnerPrimitive>

// Simplified theme handling for now
const Toaster = ({ ...props }: ToasterProps) => {
  // const { theme = "system" } = useTheme() // Removed useTheme
  const currentTheme = "dark"; // Placeholder or use a context if available

  return (
    <SonnerPrimitive
      theme={currentTheme as ToasterProps["theme"]} // Use simplified theme
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
