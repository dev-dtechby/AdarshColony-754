"use client";

interface Props {
  terms: string;
  agree: boolean;
  onAgreeChange: (v: boolean) => void;
}

export default function TermsBox({ terms, agree, onAgreeChange }: Props) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Term’s & Condition</h3>

      <div className="rounded-lg border p-4 bg-muted/20 whitespace-pre-wrap text-sm leading-6">
        {terms}
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-1"
          checked={agree}
          onChange={(e) => onAgreeChange(e.target.checked)}
        />
        <span>मैंने Term’s & Condition पढ़ लिए हैं और मैं सहमत हूँ।</span>
      </label>
    </div>
  );
}
