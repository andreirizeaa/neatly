import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ExitResearchDialogProps {
    isOpen: boolean
    onConfirm: () => void
    onCancel: () => void
}

export function ExitResearchDialog({ isOpen, onConfirm, onCancel }: ExitResearchDialogProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Research in Progress</AlertDialogTitle>
                    <AlertDialogDescription>
                        The research agent is still running. If you leave now, only the topics that have completed analysis will be saved.
                        <br /><br />
                        Do you want to exit properly?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onCancel}>Stay on Page</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Exit Analysis
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
