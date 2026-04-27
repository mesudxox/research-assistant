from abc import ABC, abstractmethod
from selenium.webdriver.remote.webdriver import WebDriver

class BasePlugin(ABC):
    def __init__(self, driver: WebDriver):
        self.driver = driver

    @property
    @abstractmethod
    def domain(self):
        """Must return the domain string, e.g., 'trendyol.com'"""
        pass

    @abstractmethod
    def scrape(self):
        """Must return a dictionary of scraped data"""
        pass