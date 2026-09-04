import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { loginWithGoogle } from '@/context/AuthContext';
import { Mail } from 'lucide-react';

export default function AuthModal({ open, onOpenChange }) {
  const [email, setEmail] = useState('');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="auth-modal-dialog" className="bg-cloud-card border-willow/15 rounded-3xl p-0 max-w-md overflow-hidden">
        <div className="relative p-8">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-mimosa-soft/70 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-azul-light/40 blur-3xl pointer-events-none" />
          <DialogHeader className="relative">
            <div className="w-12 h-12 rounded-full bg-willow/10 flex items-center justify-center mb-4">
              <img src="/logo.png" alt="" className="w-7 h-7" />
            </div>
            <DialogTitle className="font-serif text-3xl text-willow-dark font-light leading-tight">
              A quiet doorway
              <br />
              <span className="text-willow/70">into your sanctuary</span>
            </DialogTitle>
            <p className="mt-3 text-sm text-[#535E56]">
              Support that doesn't ask for an answer. No metrics, no read receipts.
            </p>
          </DialogHeader>
          <div className="relative mt-8 space-y-3">
            <Button
              data-testid="auth-google-btn"
              onClick={loginWithGoogle}
              className="w-full h-12 rounded-full bg-willow hover:bg-willow-dark text-cloud font-sans text-sm gap-3"
            >
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#fff" d="M22.6 12.2c0-.8-.1-1.4-.2-2H12v3.8h6c-.3 1.4-1.1 2.6-2.4 3.4v2.8h3.9c2.3-2.1 3.6-5.2 3.6-8z"/><path fill="#fff" d="M12 23c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-4.9H1.3v3.1C3.3 20.5 7.3 23 12 23z"/><path fill="#fff" d="M5.3 13.4c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2V6H1.3C.5 7.6 0 9.4 0 11.2s.5 3.6 1.3 5.1l4-2.9z"/><path fill="#fff" d="M12 4.4c1.7 0 3.3.6 4.5 1.7l3.4-3.4C18 .9 15.2 0 12 0 7.3 0 3.3 2.5 1.3 6.1l4 3.1c.9-2.9 3.6-4.8 6.7-4.8z"/></svg>
              Continue with Google
            </Button>
            <div className="flex items-center gap-3 my-2 text-xs uppercase tracking-[0.2em] text-willow-light">
              <div className="h-px flex-1 bg-willow/15" />
              <span>or by email</span>
              <div className="h-px flex-1 bg-willow/15" />
            </div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-willow-light" />
              <Input
                data-testid="auth-email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@quiet.place"
                className="h-12 pl-11 rounded-full bg-cloud-subtle border-willow/10 focus-visible:ring-mimosa"
              />
            </div>
            <Button
              data-testid="auth-email-btn"
              onClick={loginWithGoogle}
              variant="outline"
              className="w-full h-12 rounded-full border-willow/20 hover:bg-mimosa-soft text-willow-dark"
            >
              Send me a soft link
            </Button>
            <p className="text-[11px] text-willow-light text-center pt-4 leading-relaxed">
              By continuing you agree to hold this space gently.<br/>
              Nothing here is public unless you choose.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
