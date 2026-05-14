import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetPortal = DialogPrimitive.Portal;

export const SheetOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay ref={ref} className={cn('fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm', className)} {...props} />
));
SheetOverlay.displayName = 'SheetOverlay';

export const SheetContent = React.forwardRef(({ className, children, side = 'right', ...props }, ref) => {
  const sideClass = side === 'bottom'
    ? 'inset-x-0 bottom-0 rounded-t-xl'
    : 'right-0 top-0 h-full border-l';
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn('fixed z-50 w-full max-w-xl border-slate-200 bg-white p-6 shadow-2xl outline-none', sideClass, className)}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
          <X size={18} />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </SheetPortal>
  );
});
SheetContent.displayName = 'SheetContent';

export const SheetHeader = ({ className, ...props }) => <div className={cn('grid gap-1.5 text-left', className)} {...props} />;
export const SheetFooter = ({ className, ...props }) => <div className={cn('mt-6 flex justify-end gap-2', className)} {...props} />;
export const SheetTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn('text-xl font-bold text-slate-950', className)} {...props} />
));
SheetTitle.displayName = 'SheetTitle';
export const SheetDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn('text-sm text-slate-600', className)} {...props} />
));
SheetDescription.displayName = 'SheetDescription';
