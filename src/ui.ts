import { createIcons, icons } from 'lucide';
import { RepoData } from './objects';

export class UIController {
  private overlay: HTMLElement;
  private detailsPanel: HTMLElement;
  private closeBtn: HTMLElement;
  private loadingScreen: HTMLElement;
  
  constructor(private onFocusClear: () => void) {
    this.overlay = document.getElementById('hud-overlay')!;
    this.detailsPanel = document.getElementById('details-panel')!;
    this.closeBtn = document.getElementById('close-panel')!;
    this.loadingScreen = document.getElementById('loading-screen')!;

    createIcons({ icons });

    this.closeBtn.addEventListener('click', () => {
      this.hideDetails();
      this.onFocusClear();
    });
  }

  public showHUD() {
    this.overlay.classList.remove('opacity-0');
    this.loadingScreen.classList.add('opacity-0');
    setTimeout(() => {
      this.loadingScreen.style.display = 'none';
    }, 1000);
  }

  public updateLoading(progress: number) {
    const bar = document.getElementById('loading-bar');
    if (bar) {
      bar.style.width = `${progress * 100}%`;
    }
  }

  public showDetails(repo: RepoData) {
    document.getElementById('repo-name')!.textContent = repo.name;
    document.getElementById('repo-desc')!.textContent = repo.description;
    (document.getElementById('repo-link') as HTMLAnchorElement).href = repo.url;
    
    const siteLink = document.getElementById('site-link') as HTMLAnchorElement;
    if (repo.homepageUrl) {
      siteLink.href = repo.homepageUrl;
      siteLink.classList.remove('hidden');
    } else {
      siteLink.classList.add('hidden');
    }

    // Badges / Topics
    const topicsContainer = document.getElementById('repo-topics')!;
    topicsContainer.innerHTML = '';
    
    // Add primary language first
    topicsContainer.appendChild(this.createBadge(repo.primaryLanguage, true));
    
    // Add other topics
    repo.topics.forEach(t => {
      if (t.toLowerCase() !== repo.primaryLanguage.toLowerCase()) {
         topicsContainer.appendChild(this.createBadge(t));
      }
    });

    // Also show languages breakdown if space allows
    if (repo.languages && repo.languages.length > 0) {
       const langBreakdown = document.createElement('div');
       langBreakdown.className = 'w-full flex h-1 rounded overflow-hidden mt-3 bg-gray-800';
       
       repo.languages.forEach(lang => {
         const segment = document.createElement('div');
         segment.style.width = `${lang.percentage}%`;
         // Generate color based on name loosely, or just default to cyan
         segment.style.backgroundColor = this.getLangColor(lang.name);
         segment.title = `${lang.name} ${lang.percentage}%`;
         langBreakdown.appendChild(segment);
       });
       topicsContainer.appendChild(langBreakdown);
    }

    this.detailsPanel.classList.remove('opacity-0', 'translate-x-12');
    this.detailsPanel.classList.add('opacity-100', 'translate-x-0');
  }

  public hideDetails() {
    this.detailsPanel.classList.remove('opacity-100', 'translate-x-0');
    this.detailsPanel.classList.add('opacity-0', 'translate-x-12');
  }

  private createBadge(text: string, primary: boolean = false) {
    const el = document.createElement('span');
    el.textContent = text;
    if (primary) {
      el.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/50';
    } else {
      el.className = 'px-2 py-0.5 rounded text-[10px] bg-gray-800/80 text-gray-400 border border-gray-700';
    }
    return el;
  }

  private getLangColor(lang: string) {
    const l = lang.toLowerCase();
    if (['c++', 'c', 'rust', 'matlab', 'cmake'].includes(l)) return '#0088ff';
    if (['python', 'jupyter notebook', 'r'].includes(l)) return '#ff8800';
    return '#00ff88';
  }
}
