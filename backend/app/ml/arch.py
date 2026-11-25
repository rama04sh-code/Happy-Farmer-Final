def build_model(num_classes: int, pretrained: bool = False):
    """MobileNetV2: خفيف ومناسب لخادم بدون GPU. نفس البنية للتدريب والاستدلال."""
    import torch
    from torchvision import models

    weights = models.MobileNet_V2_Weights.IMAGENET1K_V1 if pretrained else None
    model = models.mobilenet_v2(weights=weights)
    model.classifier[1] = torch.nn.Linear(model.last_channel, num_classes)
    return model
