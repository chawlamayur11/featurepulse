import re
from typing import List, Tuple
from app.models import Post

STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", 
    "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", 
    "by", "can", "could", "did", "do", "does", "doing", "down", "during", "each", "few", "for", 
    "from", "further", "had", "has", "have", "having", "he", "her", "here", "hers", "herself", 
    "him", "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just", 
    "me", "more", "most", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", 
    "or", "other", "our", "ours", "ourselves", "out", "over", "own", "same", "she", "should", 
    "so", "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves", "then", 
    "there", "these", "they", "this", "those", "through", "to", "too", "under", "until", "up", 
    "very", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why", 
    "with", "would", "you", "your", "yours", "yourself", "yourselves", "add", "please", "support", 
    "allow", "make", "want", "like", "need"
}

CATEGORY_KEYWORDS = {
    "UI/UX": ["dark mode", "theme", "font", "color", "layout", "button", "ui", "ux", "design", "view", "sidebar", "responsive"],
    "Performance": ["slow", "speed", "fast", "cache", "lag", "latency", "memory", "load", "loading", "optimize", "optimization"],
    "Integrations": ["slack", "github", "webhook", "discord", "api", "oauth", "jira", "export", "zapier", "sso"],
    "Security": ["auth", "2fa", "mfa", "login", "password", "permission", "role", "audit", "rbac", "encryption"],
    "Core Feature": ["filter", "search", "export", "import", "sort", "roadmap", "tag", "category", "notification", "email"],
    "Bug": ["crash", "error", "broken", "fail", "failure", "bug", "exception", "freeze", "blank"]
}

def clean_tokens(text: str) -> set[str]:
    words = re.findall(r"\b[a-zA-Z0-9]{2,}\b", text.lower())
    return {w for w in words if w not in STOPWORDS}

def get_char_trigrams(text: str) -> set[str]:
    clean = re.sub(r"\s+", " ", text.lower().strip())
    if len(clean) < 3:
        return {clean}
    return {clean[i:i+3] for i in range(len(clean) - 2)}

def compute_similarity(query: str, target: str) -> float:
    """
    Computes hybrid token-Jaccard and character-trigram similarity between 0.0 and 1.0.
    """
    q_tokens = clean_tokens(query)
    t_tokens = clean_tokens(target)

    # Token Jaccard
    if not q_tokens or not t_tokens:
        token_sim = 0.0
    else:
        token_intersect = len(q_tokens & t_tokens)
        token_union = len(q_tokens | t_tokens)
        token_sim = token_intersect / token_union if token_union > 0 else 0.0

    # Trigram Jaccard
    q_tri = get_char_trigrams(query)
    t_tri = get_char_trigrams(target)
    tri_intersect = len(q_tri & t_tri)
    tri_union = len(q_tri | t_tri)
    tri_sim = tri_intersect / tri_union if tri_union > 0 else 0.0

    # Weighted score
    score = (0.55 * token_sim) + (0.45 * tri_sim)
    return round(score, 3)

def find_duplicates(query: str, all_posts: List[Post], threshold: float = 0.40) -> List[Tuple[Post, float]]:
    scored = []
    for post in all_posts:
        sim = compute_similarity(query, post.title)
        # Also check description if title similarity is moderate
        if sim > 0.30:
            desc_sim = compute_similarity(query, post.description[:200])
            sim = max(sim, round(0.7 * sim + 0.3 * desc_sim, 3))
        if sim >= threshold:
            scored.append((post, sim))

    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[:5]

def suggest_categories(title: str, description: str) -> List[str]:
    combined = f"{title} {description}".lower()
    matches = []
    for cat, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in combined for kw in keywords):
            matches.append(cat)
    return matches if matches else ["Core Feature"]
