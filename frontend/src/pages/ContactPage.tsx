import { ContactForm } from '@/features/contact';

// CONTENT-002.
function ContactPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="space-y-1">
        <h1 className="text-h1 text-foreground font-semibold">Contact us</h1>
        <p className="text-body text-muted-foreground">
          Have a question or need help? Send us a message and we&apos;ll get back to you.
        </p>
      </div>
      <ContactForm />
    </div>
  );
}

export { ContactPage };
