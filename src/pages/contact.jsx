import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUser } from "@clerk/react";
import { BarLoader } from "react-spinners";
import { Mail, CheckCircle2, Bug, MessageCircleQuestion, Lightbulb, MoreHorizontal, Clock, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import usePublicFetch from "@/hooks/use-public-fetch";
import { submitContactMessage } from "@/api/apiContact";

const SUPPORT_EMAIL = "support.elevare.app@gmail.com";

const TYPES = [
  { value: "bug", label: "Report a bug", icon: Bug },
  { value: "query", label: "Ask a question", icon: MessageCircleQuestion },
  { value: "suggestion", label: "Suggest something", icon: Lightbulb },
  { value: "other", label: "Something else", icon: MoreHorizontal },
];

const schema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().min(1, { message: "Email is required" }).email({ message: "Enter a valid email" }),
  type: z.enum(["bug", "query", "suggestion", "other"], { message: "Choose a category" }),
  subject: z.string().min(1, { message: "Give it a short subject" }),
  message: z.string().min(10, { message: "Tell us a bit more (min. 10 characters)" }),
});

const ContactPage = () => {
  const { user } = useUser();
  const { data, loading, error, fn: submit } = usePublicFetch(submitContactMessage);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.fullName || "",
      email: user?.primaryEmailAddress?.emailAddress || "",
      type: "query",
      subject: "",
      message: "",
    },
  });

  useEffect(() => {
    if (data) reset({ name: "", email: "", type: "query", subject: "", message: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const onSubmit = (values) => submit(values);

  return (
    <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
      <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        {/* Intro */}
        <div>
          <h1 className="font-display text-5xl leading-tight sm:text-6xl">Contact &amp; Support</h1>
          <p className="mt-6 max-w-sm text-lg leading-relaxed text-muted-foreground">
            Found a bug, have a question, or an idea for us? Send it over — a real person reads every message.
          </p>

          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-8 inline-flex items-center gap-2.5 text-sm text-foreground/80 transition-colors hover:text-foreground"
          >
            <Mail className="h-4 w-4 text-muted-foreground" />
            {SUPPORT_EMAIL}
          </a>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> Usually replies within 24 hours.
          </p>

          <Link
            to="/#faq"
            className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Need a quick answer? Visit FAQs <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Form */}
        <div className="hairline rounded-2xl bg-surface/60 p-6 sm:p-8">
          {data ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-success/10">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <p className="font-display text-2xl">Message received</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                We'll reply to <span className="text-foreground/80">{data.email}</span> within 24 hours.
              </p>
              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                Send another message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <div>
                    <Label className="mb-3">What's this about?</Label>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="grid grid-cols-2 gap-2.5"
                    >
                      {TYPES.map(({ value, label, icon: Icon }) => (
                        <Label
                          key={value}
                          htmlFor={`type-${value}`}
                          className={`hairline flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-normal transition-all duration-150 ${
                            field.value === value
                              ? "scale-[1.02] border-primary bg-primary/10 text-foreground ring-2 ring-primary/20"
                              : "text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                          }`}
                        >
                          <RadioGroupItem value={value} id={`type-${value}`} className="sr-only" />
                          <Icon className={`h-4 w-4 shrink-0 ${field.value === value ? "text-primary" : ""}`} />
                          {label}
                        </Label>
                      ))}
                    </RadioGroup>
                    {errors.type && <p className="mt-2 text-xs text-destructive">{errors.type.message}</p>}
                  </div>
                )}
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name" className="mb-2">Name</Label>
                  <Input id="name" placeholder="Jane Doe" {...register("name")} />
                  {errors.name && <p className="mt-1.5 text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="email" className="mb-2">Email</Label>
                  <Input id="email" type="email" placeholder="jane@email.com" {...register("email")} />
                  {errors.email && <p className="mt-1.5 text-xs text-destructive">{errors.email.message}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="subject" className="mb-2">Subject</Label>
                <Input id="subject" placeholder="Short summary" {...register("subject")} />
                {errors.subject && <p className="mt-1.5 text-xs text-destructive">{errors.subject.message}</p>}
              </div>

              <div>
                <Label htmlFor="message" className="mb-2">Message</Label>
                <Textarea id="message" rows={5} placeholder="Tell us what's going on…" {...register("message")} />
                {errors.message && <p className="mt-1.5 text-xs text-destructive">{errors.message.message}</p>}
              </div>

              {loading && <BarLoader width="100%" color="oklch(0.68 0.19 293)" />}
              {error && <p className="text-sm text-destructive">{error.message}</p>}

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? "Sending…" : "Send message"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactPage;