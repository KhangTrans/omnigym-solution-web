import { motion } from "framer-motion";
import { Star } from "lucide-react";

const reviews = [
  {
    quote: "OmniGym đã thay đổi hoàn toàn cách tôi tập luyện. Các huấn luyện viên thực sự quan tâm, và năng lượng tại phòng tập rất dễ lây lan.",
    name: "Emma Rodriguez",
    role: "Kỹ sư phần mềm",
    initials: "ER",
  },
  {
    quote: "Phòng tập tốt nhất tôi từng tham gia trong 10 năm qua. Trang thiết bị hiện đại, không gian sạch sẽ và các lớp học thực sự thử thách tôi.",
    name: "Marcus Lee",
    role: "Kiến trúc sư",
    initials: "ML",
  },
  {
    quote: "Tôi đã giảm được 8kg trong bốn tháng và cảm thấy khỏe mạnh hơn bao giờ hết. Cộng đồng ở đây thúc đẩy tôi luôn xuất hiện.",
    name: "Priya Sharma",
    role: "Trưởng nhóm Marketing",
    initials: "PS",
  },
];

export function Testimonials() {
  return (
    <section className="relative py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.58, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Đánh giá</p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl text-foreground">Được tin dùng bởi các thành viên</h2>
        </motion.div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {reviews.map((r, i) => (
            <motion.figure
              key={r.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.52, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl border border-border bg-card p-7 shadow-md"
            >
              <div className="flex gap-1 text-primary">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-4 text-foreground/90 leading-relaxed italic">"{r.quote}"</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
                  {r.initials}
                </div>
                <div>
                  <div className="font-semibold text-sm text-foreground">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.role}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
