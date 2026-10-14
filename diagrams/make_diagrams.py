"""Generate architecture and CI/CD workflow diagrams (PNG) with matplotlib."""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch

INK = "#1a1a1a"
C_APP = "#e3f2fd"
C_SEC = "#fde7e9"
C_INFRA = "#fff3e0"
C_EXT = "#eceff1"
C_OK = "#e8f5e9"


def box(ax, x, y, w, h, text, fc, fs=9, bold=False, ec="#37474f", lw=1.3, style="round,pad=0.02,rounding_size=0.08"):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle=style, fc=fc, ec=ec, lw=lw))
    ax.text(x + w / 2, y + h / 2, text, ha="center", va="center", fontsize=fs,
            fontweight="bold" if bold else "normal", color=INK, linespacing=1.25)


def arrow(ax, p1, p2, label="", rad=0.0, color="#37474f", fs=7.5, off=(0, 0.12), ls="-"):
    ax.add_patch(FancyArrowPatch(p1, p2, arrowstyle="-|>", mutation_scale=12, lw=1.3, color=color,
                                 connectionstyle=f"arc3,rad={rad}", linestyle=ls))
    if label:
        ax.text((p1[0] + p2[0]) / 2 + off[0], (p1[1] + p2[1]) / 2 + off[1], label, ha="center", va="bottom",
                fontsize=fs, color=INK, bbox=dict(boxstyle="round,pad=0.12", fc="white", ec="none", alpha=0.9))


# ------------------------------------------------------------------ Architecture
fig, ax = plt.subplots(figsize=(13, 7.2))
ax.set_xlim(0, 13)
ax.set_ylim(0, 7.2)
ax.axis("off")
ax.set_title("Application Architecture — Water Quality Monitoring & Alert System", fontsize=14, fontweight="bold", pad=10)

box(ax, 0.3, 3.1, 1.8, 1.0, "User\n(web browser)", C_EXT, 10, True)
box(ax, 0.3, 5.6, 1.8, 0.9, "CSV dataset\n(sensor readings)", C_EXT, 9)
arrow(ax, (1.2, 5.6), (1.2, 4.1), "upload", off=(0.45, 0))

# AWS cloud frame
ax.add_patch(FancyBboxPatch((2.8, 0.4), 9.9, 6.4, boxstyle="round,pad=0.02,rounding_size=0.12", fc="#fafafa", ec="#ff9800", lw=2, linestyle="--"))
ax.text(3.0, 6.55, "AWS Cloud  (region ap-south-1, default VPC)  — provisioned by Terraform", fontsize=9.5, fontweight="bold", color="#e65100", va="center")

box(ax, 3.1, 2.9, 1.9, 1.4, "Security Group\nIN: TCP 80 (public)\nOUT: TCP 443 only\nno SSH", C_SEC, 8.5)
arrow(ax, (2.1, 3.6), (3.1, 3.6), "HTTP :80", off=(0, 0.14))

ax.add_patch(FancyBboxPatch((5.4, 1.0), 7.0, 5.2, boxstyle="round,pad=0.02,rounding_size=0.1", fc=C_INFRA, ec="#ef6c00", lw=1.5))
ax.text(5.6, 5.95, "EC2 t3.micro · Amazon Linux 2023 · IMDSv2 required · encrypted gp3 root volume", fontsize=8.5, fontweight="bold", va="center")
arrow(ax, (5.0, 3.6), (5.6, 3.6))

ax.add_patch(FancyBboxPatch((5.8, 1.4), 6.2, 4.2, boxstyle="round,pad=0.02,rounding_size=0.1", fc="#e1f5fe", ec="#0277bd", lw=1.5))
ax.text(5.95, 5.35, "Docker container — non-root user, read-only FS, all capabilities dropped", fontsize=8.5, fontweight="bold", va="center", color="#01579b")

box(ax, 6.1, 3.7, 2.4, 1.2, "Gunicorn\n(2 workers, :8000)", C_APP, 9, True)
box(ax, 9.1, 3.7, 2.6, 1.2, "Flask app\nroutes: /  /health\n/api/process  /api/simulate", C_APP, 8.5)
arrow(ax, (8.5, 4.3), (9.1, 4.3))
box(ax, 9.1, 1.8, 2.6, 1.3, "Pipeline core\nvalidate → classify → alert\n(core.py)", C_OK, 8.5)
arrow(ax, (10.4, 3.7), (10.4, 3.1), "calls")
box(ax, 6.1, 1.8, 2.4, 1.3, "Static dashboard\nHTML · JS · Chart.js\n(strict CSP)", C_APP, 8.5)
arrow(ax, (9.1, 4.0), (8.5, 3.1), "serves", rad=-0.15, off=(0.1, 0.0))

box(ax, 3.1, 0.65, 2.2, 1.0, "IAM role\nSSM Session Manager\n(no SSH keys)", C_SEC, 8)
arrow(ax, (5.3, 1.15), (5.8, 1.7), "admin", ls="--", off=(0, -0.3))

box(ax, 5.8, 0.42, 6.2, 0.45, "At boot (user_data): git clone repo → docker build → docker run  (image scanned clean by Trivy)", "#f3e5f5", 8)

fig.tight_layout()
fig.savefig("architecture.png", dpi=160)
plt.close(fig)

# ------------------------------------------------------------------ CI/CD workflow
fig, ax = plt.subplots(figsize=(14, 7.2))
ax.set_xlim(0, 14)
ax.set_ylim(0, 7.2)
ax.axis("off")
ax.set_title("CI/CD & DevSecOps Workflow — GitHub → Jenkins → Docker → AWS (Terraform)", fontsize=14, fontweight="bold", pad=10)

box(ax, 0.2, 5.6, 1.5, 0.9, "Developer", C_EXT, 10, True)
box(ax, 2.3, 5.6, 1.7, 0.9, "GitHub\nrepository", C_EXT, 10, True)
box(ax, 0.2, 3.9, 1.5, 0.8, "JIRA board\n(backlog / tasks)", C_EXT, 8.5)
arrow(ax, (1.7, 6.05), (2.3, 6.05), "git push", off=(0, 0.1))
arrow(ax, (0.95, 5.6), (0.95, 4.7), "tracks", ls="--", off=(0.35, 0))

ax.add_patch(FancyBboxPatch((4.5, 0.5), 9.3, 6.2, boxstyle="round,pad=0.02,rounding_size=0.12", fc="#fafafa", ec="#d32f2f", lw=2, linestyle="--"))
ax.text(4.7, 6.45, "Jenkins declarative pipeline (Jenkinsfile)", fontsize=10.5, fontweight="bold", color="#b71c1c", va="center")
arrow(ax, (4.0, 6.05), (4.5, 6.05), "trigger", off=(0, 0.1), fs=7)

stages = [
    ("1 Checkout", C_APP), ("2 Unit tests\n+ coverage", C_APP), ("3 SonarQube\nanalysis", C_SEC), ("4 Quality\ngate", C_SEC),
    ("5 Trivy fs\ndeps+secrets+IaC", C_SEC), ("6 Docker\nbuild", C_APP), ("7 Trivy\nimage scan", C_SEC),
    ("8 Terraform\nvalidate", C_INFRA), ("9 Deploy\n(Docker, smoke test)", C_OK), ("10 Terraform apply\n(manual approval)", C_INFRA),
]
cols, w, h = 5, 1.62, 1.0
for i, (label, color) in enumerate(stages):
    row, col = divmod(i, cols)
    x = 4.8 + col * 1.78
    y = 4.9 - row * 1.9
    box(ax, x, y, w, h, label, color, 8.5, True)
    if col < cols - 1:
        arrow(ax, (x + w, y + h / 2), (x + 1.78, y + h / 2))
    elif row == 0:
        x5c, y5b = x + w / 2, y
        x6c, y6t = 4.8 + w / 2, 4.9 - 1.9 + h
        ymid = (y5b + y6t) / 2
        ax.plot([x5c, x5c, x6c], [y5b, ymid, ymid], color="#37474f", lw=1.3)
        ax.add_patch(FancyArrowPatch((x6c, ymid), (x6c, y6t), arrowstyle="-|>", mutation_scale=12, lw=1.3, color="#37474f"))

box(ax, 4.8, 1.0, 3.9, 0.9, "Artifacts archived: JUnit, coverage.xml,\nTrivy JSON reports", "#f3e5f5", 8.5)
box(ax, 9.2, 1.0, 4.3, 0.9, "AWS: EC2 + SG + IAM (Terraform)\nweb dashboard reachable on port 80", C_INFRA, 8.5, True)
arrow(ax, (12.7, 3.0), (11.6, 1.9), "provisions", off=(0.75, 0.0), rad=0.1)

ax.text(0.2, 2.9, "Legend", fontsize=9, fontweight="bold")
for i, (c, t) in enumerate([(C_APP, "build / test"), (C_SEC, "security gate"), (C_INFRA, "infrastructure"), (C_OK, "deploy")]):
    ax.add_patch(FancyBboxPatch((0.2, 2.45 - i * 0.45), 0.35, 0.28, boxstyle="round,pad=0.01", fc=c, ec="#37474f"))
    ax.text(0.7, 2.59 - i * 0.45, t, fontsize=8.5, va="center")

fig.tight_layout()
fig.savefig("cicd_workflow.png", dpi=160)
plt.close(fig)
print("saved architecture.png, cicd_workflow.png")
