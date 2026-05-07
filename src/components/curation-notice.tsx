import { PRIMARY_CONTACT_EMAIL } from "@/lib/contact";

export function CurationNotice({ scope = "本栏目" }: { scope?: string }) {
  return (
    <aside className="mt-10 rounded-md border border-dashed bg-muted/30 p-4 text-xs leading-relaxed text-muted-foreground">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0 font-semibold text-foreground">
          声明：
        </span>
        <div>
          {scope}内容由复材站编辑部整理自公开检索数据库与学术/专利公开渠道，仅供行业从业者研究参考，不构成权威法律或学术出处。
          如内容涉及版权、来源归属或其他合法权益问题，请联系网站客服（邮箱：
          <a
            href={`mailto:${PRIMARY_CONTACT_EMAIL}`}
            className="text-primary hover:underline"
          >
            {PRIMARY_CONTACT_EMAIL}
          </a>
          ），我们将在核实后及时删除或更正。
        </div>
      </div>
    </aside>
  );
}
