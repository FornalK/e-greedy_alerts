import numpy as np
import random

class EpsilonGreedy:
    def __init__(self, n_variants, epsilon):
        self.n_variants = n_variants
        self.epsilon = epsilon
        self.counts = np.zeros(n_variants)  # Liczba wyświetleń każdego wariantu
        self.values = np.zeros(n_variants)  # Średnie nagrody dla każdego wariantu

    def select_variant(self):
        if random.random() < self.epsilon:
            # Eksploracja: wybierz losowy wariant
            return random.randint(0, self.n_variants - 1)
        else:
            # Eksploatacja: wybierz wariant z najwyższą średnią nagrodą
            return np.argmax(self.values)

    def update(self, variant, reward):
        # Zaktualizuj liczbę wyświetleń i średnią nagrodę dla wybranego wariantu
        self.counts[variant] += 1
        n = self.counts[variant]
        value = self.values[variant]
        # Oblicz nową średnią nagrodę
        new_value = ((n - 1) / n) * value + (1 / n) * reward
        self.values[variant] = new_value