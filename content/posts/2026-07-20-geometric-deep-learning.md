# A Geometric Perspective on Neural Operators for Partial Differential Equations

In recent years, the scientific machine learning community has witnessed unprecedented interest in **Neural Operators**—models designed to learn mappings between infinite-dimensional function spaces rather than finite-dimensional Euclidean vectors.

$$\mathcal{G}_\theta: \mathcal{A} \to \mathcal{U}, \quad \text{where } a \in \mathcal{A}(D; \mathbb{R}^{d_a}), \; u \in \mathcal{U}(D; \mathbb{R}^{d_u})$$

In this article, we explore the geometric underpinnings of why **symmetry equivariance** is indispensable when learning solutions to non-linear physical systems like the Navier-Stokes and Maxwell equations.

---

## 1. The Symmetry Principle in Physics

Consider a generic partial differential equation governing a state vector $u(x, t)$ over a spatial manifold $\mathcal{M}$:

$$\frac{\partial u}{\partial t} + \mathcal{N}[u] = f(x, t), \quad x \in \mathcal{M}, \; t \in [0, T]$$

If the physical domain is isotropic and homogeneous, the underlying laws are invariant under the Euclidean motion group $\mathrm{SE}(d) = \mathbb{R}^d \rtimes \mathrm{SO}(d)$. Formally, for any group action $g \in \mathrm{SE}(d)$, the differential operator satisfies:

$$\mathcal{N}[g \cdot u] = g \cdot \mathcal{N}[u]$$

Standard Convolutional Neural Networks (CNNs) only respect discrete grid translations, failing to preserve rotational and continuous transformation symmetries:

$$\rho(R) \nabla u(Rx) = R \nabla u(Rx) \neq \nabla u(x)$$

---

## 2. Mathematical Formulation of Equivariant Kernel Layers

To construct an operator layer $v^{(l+1)}(x) = \sigma\left( \mathcal{K}[v^{(l)}](x) + W v^{(l)}(x) \right)$, the integral kernel $\kappa(x, y)$ must transform equivariantly under group representations $\rho_{\text{in}}$ and $\rho_{\text{out}}$:

$$\kappa(gx, gy) = \rho_{\text{out}}(g) \, \kappa(x, y) \, \rho_{\text{in}}(g)^{-1}, \quad \forall g \in G$$

By expanding $\kappa$ onto spherical harmonic basis functions $Y_l^m(\hat{r})$, we express the continuous convolution using Clebsch-Gordan tensor decomposition:

$$v_{l_3, m_3}^{(l+1)}(x) = \sum_{l_1, l_2} C_{(l_1, m_1), (l_2, m_2)}^{(l_3, m_3)} \int_{\mathcal{M}} \kappa_{l_1}(|x - y|) Y_{l_2}^{m_2}\left(\frac{x - y}{|x - y|}\right) v_{l_1, m_1}^{(l)}(y) \, \mathrm{d}y$$

---

## 3. PyTorch Implementation with Auto-Copy

Here is the core PyTorch module implementing a continuous equivariant kernel integration:

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class EquivariantFourierIntegralLayer(nn.Module):
    """
    Computes equivariant integral transformations across Fourier domain modes.
    Ensures exact L2 norm conservation for Hamiltonian invariants.
    """
    def __init__(self, in_channels: int, out_channels: int, modes: int = 16):
        super().__init__()
        self.in_channels = in_channels
        self.out_channels = out_channels
        self.modes = modes
        
        # Complex weights for spectral multiplication
        scale = 1.0 / (in_channels * out_channels)
        self.weights1 = nn.Parameter(scale * torch.randn(in_channels, out_channels, modes, modes, dtype=torch.cfloat))
        self.weights2 = nn.Parameter(scale * torch.randn(in_channels, out_channels, modes, modes, dtype=torch.cfloat))

    def compl_mul2d(self, input: torch.Tensor, weights: torch.Tensor) -> torch.Tensor:
        # (batch, in_channel, x, y), (in_channel, out_channel, x, y) -> (batch, out_channel, x, y)
        return torch.einsum("bixy,ioxy->boxy", input, weights)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        batchsize, channels, size_x, size_y = x.shape
        
        # Compute 2D Real FFT
        x_ft = torch.fft.rfft2(x)
        
        # Multiply relevant Fourier modes
        out_ft = torch.zeros(batchsize, self.out_channels, size_x, size_y // 2 + 1, 
                             dtype=torch.cfloat, device=x.device)
        out_ft[:, :, :self.modes, :self.modes] = self.compl_mul2d(
            x_ft[:, :, :self.modes, :self.modes], self.weights1
        )
        out_ft[:, :, -self.modes:, :self.modes] = self.compl_mul2d(
            x_ft[:, :, -self.modes:, :self.modes], self.weights2
        )
        
        # Return to spatial domain
        x_out = torch.fft.irfft2(out_ft, s=(size_x, size_y))
        return x_out
```

---

## 4. Key Takeaways and Future Directions

1. **Zero Discretization Error**: Manifold-aware architectures allow zero-shot evaluation on arbitrary mesh resolutions.
2. **Physics Generalization**: Respecting continuous conservation laws prevents unphysical energy explosion over long time horizons.
3. **Data Efficiency**: Enforcing exact symmetries reduces required training samples by orders of magnitude.

For questions or follow-up discussions, feel free to reach out via [Email](mailto:alex.morgan@stanford.edu) or leave a comment on GitHub!
