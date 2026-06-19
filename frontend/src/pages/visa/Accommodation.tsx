import { Check, ShieldAlert, X } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { SourceLink } from "@/components/common/SourceLink";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ACCOMMODATION_CHANNELS, RENTAL_SCAM_FLAGS } from "@/lib/seed/visa";
import { source } from "@/lib/sources";

/** Accommodation finder — compares housing channels and warns about rental scams. */
export default function VisaAccommodation() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 25 · Visa"
        title="Accommodation finder"
        description="Find student housing — Studierendenwerk dorms and the private market — and avoid common rental scams."
        category="visa"
        fileRef="§ 25"
      />

      <Disclaimer />

      <Alert variant="danger">
        <ShieldAlert aria-hidden />
        <AlertTitle>Beware of rental scams</AlertTitle>
        <AlertDescription className="text-red-900">
          <ul className="mt-1 space-y-1.5">
            {RENTAL_SCAM_FLAGS.map((flag) => (
              <li key={flag} className="flex gap-2">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden />
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>

      <section aria-labelledby="channels-heading">
        <h2 id="channels-heading" className="eyebrow mb-3">
          Housing channels compared
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {ACCOMMODATION_CHANNELS.map((channel) => (
            <Card key={channel.id} className="relative overflow-hidden">
              <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-category-visa" />
              <CardHeader className="pl-6">
                <CardTitle className="text-base">{channel.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{channel.summary}</p>
              </CardHeader>
              <CardContent className="space-y-3 pl-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <ul className="space-y-1">
                    {channel.pros.map((pro) => (
                      <li key={pro} className="flex gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                  <ul className="space-y-1">
                    {channel.cons.map((con) => (
                      <li key={con} className="flex gap-2 text-sm">
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                        <span className="text-muted-foreground">{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="rounded-md bg-muted/50 px-3 py-2 text-xs">
                  <span className="eyebrow !tracking-[0.12em]">Tip · </span>
                  {channel.bestFor}
                </p>
                {channel.source && <SourceLink source={channel.source} />}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="rounded-md border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
        <p>
          Rents vary widely by city, so no figures are quoted here — check current local listings.
          Dorms are administered by the regional Studierendenwerk; apply the moment you have an
          admission letter, as waiting lists are long.
        </p>
        <p className="mt-2">
          <SourceLink source={source("studentenwerk")} />
        </p>
      </div>
    </div>
  );
}
