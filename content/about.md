# Biography

I am a Postdoctoral Researcher in the **Department of Computer Science** and the **Artificial Intelligence Laboratory (SAIL)** at **Stanford University**, working with Prof. Elena Rostova. Previously, I earned my Ph.D. in Computer Science from **MIT**, where I was advised by Prof. David K. Marcus, and completed my B.S. in Mathematics and Computer Science at **UC Berkeley** with Highest Distinction.

My research lies at the intersection of **deep learning theory**, **scientific computing**, and **mathematical optimization**. Specifically, I am interested in understanding the mathematical foundations of deep neural networks and using these insights to design provably reliable machine learning systems for physical and engineering applications.

> *"Mathematics is the language with which God has written the universe."* — Galileo Galilei

---

## Research Focus & Mathematical Foundations

Modern deep learning achieves remarkable empirical success, yet theoretical guarantees regarding stability, generalizability, and constraint-satisfaction remain open problems. My current work centers on three primary directions:

### 1. Geometric Deep Learning & Equivariant Networks
We study neural network architectures that respect the fundamental physical symmetries of the underlying domain. For a symmetry group $G$ acting on input space $\mathcal{X}$ and feature space $\mathcal{Y}$, we formulate layer transformations $f: \mathcal{X} \to \mathcal{Y}$ satisfying the exact equivariance condition:

$$f(g \cdot x) = \rho(g) \cdot f(x), \quad \forall g \in G, \; \forall x \in \mathcal{X}$$

where $\rho: G \to \mathrm{GL}(\mathcal{Y})$ denotes the group representation.

### 2. Physics-Informed Machine Learning (SciML)
Integrating governing partial differential equations (PDEs) directly into neural network loss landscapes:

$$\mathcal{L}_{\text{SciML}}(\theta) = \frac{1}{N} \sum_{i=1}^N \left\| \mathcal{D}_{\mathbf{x}}[u_\theta](\mathbf{x}_i) - f(\mathbf{x}_i) \right\|^2 + \lambda_{\text{bc}} \mathcal{L}_{\text{boundary}}(\theta)$$

where $\mathcal{D}_{\mathbf{x}}$ represents nonlinear differential operators (e.g. Navier-Stokes, Schrödinger equations).

### 3. Non-Convex Optimization & Loss Surface Geometry
Analyzing gradient flow trajectories along non-convex empirical risk surfaces:

$$\frac{\mathrm{d}\mathbf{w}(t)}{\mathrm{d}t} = -\nabla_{\mathbf{w}} \mathcal{L}(\mathbf{w}(t)) - \gamma \mathbf{w}(t) + \sqrt{2\beta^{-1}}\boldsymbol{\xi}(t)$$

---

## Open Source & Python Code Example

Here is a minimal PyTorch snippet demonstrating our equivariant tensor projection operator:

```python
import torch
import torch.nn as nn

class EquivariantSO3Layer(nn.Module):
    """
    Equivariant Tensor Product Layer under SO(3) rotations.
    Applies Clebsch-Gordan decomposition on harmonic representations.
    """
    def __init__(self, in_features: int, out_features: int, l_max: int = 2):
        super().__init__()
        self.in_features = in_features
        self.out_features = out_features
        self.weights = nn.Parameter(torch.randn(out_features, in_features))

    def forward(self, x: torch.Tensor, spherical_harmonics: torch.Tensor) -> torch.Tensor:
        # Compute SO(3) equivariant product
        proj = torch.einsum('bni,oi->bno', x, self.weights)
        return torch.relu(proj) * spherical_harmonics

# Quick instantiation
layer = EquivariantSO3Layer(in_features=64, out_features=128)
print("Model initialized successfully:", layer)
```

---

## Prospective Students & Collaborators

I am always delighted to mentor highly motivated undergraduate and graduate students with strong mathematical backgrounds (linear algebra, real analysis, differential geometry) and enthusiasm for deep learning. If you are interested in collaborating, please send an email with your CV and a brief description of your research interests!
